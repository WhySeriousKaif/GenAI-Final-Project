// =========================================================================
// In-Memory Retrieval-Augmented Generation (RAG) Service
// =========================================================================
// Lets users "chat" with a contract. Retrieval prefers cached online embeddings
// (one query embedding per question); offline it uses a TF-IDF keyword vectorizer.
// All vendor-specific embedding/answer calls go through the LLMProvider layer —
// this service owns only chunking, similarity math, caching policy, and retrieval.

const {
  EMBEDDING_MODEL,
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  TOP_K,
  MAX_DOC_BYTES
} = require('../config/aiConfig');
const { getProvider } = require('./llm');

/**
 * Splits a long text string into smaller chunks with overlapping text.
 * Overlaps ensure context is not lost at the boundary of a cut.
 */
const chunkText = (text, chunkSize = CHUNK_SIZE, chunkOverlap = CHUNK_OVERLAP) => {
  const chunks = [];
  let index = 0;

  // Clean double spaces or excessive newlines to normalize structure
  const normalizedText = text.replace(/\s+/g, ' ');

  while (index < normalizedText.length) {
    const chunk = normalizedText.substring(index, index + chunkSize);
    chunks.push(chunk);
    index += (chunkSize - chunkOverlap);
  }

  return chunks;
};

/**
 * Computes Cosine Similarity between two numerical arrays (range -1..1).
 */
const cosineSimilarity = (vecA, vecB) => {
  let dotProduct = 0.0;
  let normA = 0.0;
  let normB = 0.0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// =========================================================================
// OFFLINE TERM-FREQUENCY VECTORIZER (Fallback Mode)
// =========================================================================

const computeTFVector = (text, vocabulary) => {
  const words = text.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
  const vector = new Array(vocabulary.length).fill(0);

  words.forEach(word => {
    const idx = vocabulary.indexOf(word);
    if (idx !== -1) {
      vector[idx] += 1;
    }
  });

  return vector;
};

const buildVocabulary = (chunks) => {
  const vocabSet = new Set();
  chunks.forEach(chunk => {
    const words = chunk.toLowerCase().match(/\b[a-z0-9]+\b/g) || [];
    words.forEach(word => {
      if (word.length > 2) {
        vocabSet.add(word);
      }
    });
  });
  return Array.from(vocabSet);
};

/**
 * OFFLINE retrieval: TF-IDF keyword overlap over freshly chunked text.
 * Used when no online embeddings are available (offline mode or cache failure).
 */
const searchRelevantContext = async (contractText, query, topK = TOP_K) => {
  const chunks = chunkText(contractText);
  if (chunks.length === 0) return '';

  try {
    const vocabulary = buildVocabulary(chunks);
    const queryVector = computeTFVector(query, vocabulary);

    const scoredChunks = chunks.map(chunk => {
      const chunkVector = computeTFVector(chunk, vocabulary);
      const score = cosineSimilarity(queryVector, chunkVector);
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    return scoredChunks.slice(0, topK).map(item => item.chunk).join('\n\n');
  } catch (error) {
    console.error(`[RAG TF-IDF Error]: ${error.message}`);
    return chunks.slice(0, topK).join('\n\n');
  }
};

/**
 * Generates online embeddings for every chunk of a contract's text via the
 * provider. Expensive — run once at upload (or lazily on first chat), never per
 * question. Returns null offline or on total failure so callers degrade safely.
 */
const generateEmbeddings = async (rawText) => {
  const provider = getProvider();
  if (!provider.canEmbed) return null; // Online-only cache.

  const chunks = chunkText(rawText);
  if (chunks.length === 0) return null;

  try {
    const vectors = await provider.embed(chunks);

    // Keep chunks that embedded successfully, preserving order/text mapping.
    const embedded = [];
    vectors.forEach((vector, index) => {
      if (vector) embedded.push({ index, text: chunks[index], vector });
    });
    if (embedded.length === 0) return null;

    return {
      model: EMBEDDING_MODEL,
      dimension: embedded[0].vector.length,
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
      generatedAt: new Date(),
      chunks: embedded
    };
  } catch (error) {
    console.error(`[RAG Embed] Generation failed: ${error.message}`);
    return null;
  }
};

/**
 * Conservative byte estimate to keep the contract document under MongoDB's 16MB
 * ceiling before caching vectors. If it doesn't fit, skip persistence.
 */
const fitsDocLimit = (rawText, embeddings) => {
  if (!embeddings || !embeddings.chunks) return false;
  let bytes = rawText ? rawText.length : 0;
  for (const c of embeddings.chunks) {
    bytes += (c.text ? c.text.length : 0) + (c.vector ? c.vector.length * 8 : 0);
  }
  return bytes < MAX_DOC_BYTES;
};

/**
 * Fast retrieval: embeds ONLY the query, then cosine-ranks against cached vectors.
 */
const searchWithCachedVectors = async (cachedChunks, query, topK = TOP_K) => {
  const [queryVector] = await getProvider().embed([query]);
  if (!queryVector) throw new Error('Query embedding failed');

  const scored = cachedChunks.map(c => ({
    chunk: c.text,
    score: cosineSimilarity(queryVector, c.vector)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(item => item.chunk).join('\n\n');
};

/**
 * Resolves the most relevant context, preferring cached online embeddings.
 * Lazily computes + persists for un-cached contracts (self-heal), and falls back
 * to the offline TF-IDF retriever on any failure so chat never breaks.
 */
const retrieveContext = async (contract, question, topK = TOP_K) => {
  if (getProvider().canEmbed) {
    try {
      const cached = contract.embeddings;
      const validCache =
        cached &&
        cached.model === EMBEDDING_MODEL &&
        Array.isArray(cached.chunks) &&
        cached.chunks.length > 0;

      let chunksToUse = validCache ? cached.chunks : null;

      if (!chunksToUse) {
        const generated = await generateEmbeddings(contract.rawText);
        if (generated && generated.chunks.length > 0) {
          chunksToUse = generated.chunks;
          if (fitsDocLimit(contract.rawText, generated)) {
            try {
              contract.embeddings = generated;
              await contract.save();
              console.log(`[RAG] Lazily cached ${generated.chunks.length} embeddings for "${contract.title}".`);
            } catch (saveErr) {
              console.error(`[RAG] Failed to persist lazy cache: ${saveErr.message}`);
            }
          } else {
            console.warn(`[RAG] Embeddings exceed safe doc size for "${contract.title}"; using in-memory only.`);
          }
        }
      } else {
        console.log(`[RAG] Cache hit: reusing ${chunksToUse.length} stored embeddings.`);
      }

      if (chunksToUse) {
        return await searchWithCachedVectors(chunksToUse, question, topK);
      }
    } catch (error) {
      console.error(`[RAG] Cached retrieval failed, falling back: ${error.message}`);
    }
  }

  // Offline mode, or last-resort fallback if the online cache path errored.
  return searchRelevantContext(contract.rawText, question, topK);
};

/**
 * Core chat handler: retrieve context (cache-first), then delegate answer
 * generation to the provider (OpenAI online with offline keyword fallback).
 */
const queryContract = async (contract, question) => {
  const contextText = await retrieveContext(contract, question, TOP_K);
  console.log(`[RAG] Found context length: ${contextText.length} characters.`);

  const result = await getProvider().answer(contextText, question, contract);

  return {
    answer: result.answer,
    contextUsed: contextText,
    mode: result.mode
  };
};

module.exports = {
  chunkText,
  cosineSimilarity,
  searchRelevantContext,
  generateEmbeddings,
  fitsDocLimit,
  retrieveContext,
  queryContract
};
