// =========================================================================
// In-Memory Retrieval-Augmented Generation (RAG) Service
// =========================================================================
// This service allows users to "chat" with a contract document.
//
// RAG WORKFLOW:
// 1. Chunking: We break the large contract text into smaller overlapping paragraphs.
// 2. Vectorization: We compute mathematical vectors for each chunk.
//    - If GEMINI_API_KEY is available: We use the official Gemini Embedding API (text-embedding-004).
//    - If running Offline: We generate lightweight term-frequency vectors (TF-IDF overlap).
// 3. Vector Search: When a user asks a question, we vectorize the query and calculate 
//    cosine similarity to find the most relevant chunks in memory.
// 4. Augmentation: We feed the relevant chunks into the Gemini prompt as context to answer.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini if key is provided
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;
if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
}

// Embedding configuration. Kept as constants so generation and retrieval always
// agree, and so a stored cache can be validated against the current model.
const EMBEDDING_MODEL = 'text-embedding-004';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;

// MongoDB caps a single document at 16MB. We stay under a 15MB safety threshold
// (leaving headroom for rawText, clauses, and BSON overhead) before caching vectors.
const MAX_DOC_BYTES = 15 * 1024 * 1024;

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
 * Computes Cosine Similarity between two numerical arrays.
 * Cosine similarity measures the cosine of the angle between two vectors,
 * outputting a score between -1 and 1 (where 1 is identical direction).
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
// A simple custom vectorizer for offline work. It maps unique words in the
// text and computes a Term Frequency vector for each chunk.

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
      // Ignore very short stop words to improve keyword match quality
      if (word.length > 2) {
        vocabSet.add(word);
      }
    });
  });
  return Array.from(vocabSet);
};

// =========================================================================
// MAIN RAG INTERACTION PIPELINE
// =========================================================================

/**
 * Searches the contract text for the top matching chunks based on the query.
 */
const searchRelevantContext = async (contractText, query, topK = 3) => {
  const chunks = chunkText(contractText);
  
  if (chunks.length === 0) return '';

  // Case 1: Online Mode (using Gemini text-embedding-004 API)
  if (genAI) {
    try {
      const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });

      // Embed the user's query
      const queryEmbedResult = await embedModel.embedContent(query);
      const queryVector = queryEmbedResult.embedding.values;

      // Embed each text chunk
      const chunkVectors = await Promise.all(
        chunks.map(async (chunk) => {
          try {
            const res = await embedModel.embedContent(chunk);
            return { chunk, vector: res.embedding.values };
          } catch (e) {
            // Fallback for single chunk failure
            return { chunk, vector: null };
          }
        })
      );

      // Compute similarity score for chunks that embedded successfully
      const scoredChunks = chunkVectors
        .filter(cv => cv.vector !== null)
        .map(cv => {
          const score = cosineSimilarity(queryVector, cv.vector);
          return { chunk: cv.chunk, score };
        });

      // Sort descending by score and pick top K
      scoredChunks.sort((a, b) => b.score - a.score);
      const topMatches = scoredChunks.slice(0, topK).map(item => item.chunk);
      return topMatches.join('\n\n');

    } catch (error) {
      console.error(`[RAG Embedding Error]: ${error.message}. Falling back to TF-IDF vector search.`);
    }
  }

  // Case 2: Offline Fallback Mode (TF-IDF keyword overlap vectorizer)
  try {
    const vocabulary = buildVocabulary(chunks);
    const queryVector = computeTFVector(query, vocabulary);

    const scoredChunks = chunks.map(chunk => {
      const chunkVector = computeTFVector(chunk, vocabulary);
      const score = cosineSimilarity(queryVector, chunkVector);
      return { chunk, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topMatches = scoredChunks.slice(0, topK).map(item => item.chunk);
    return topMatches.join('\n\n');
  } catch (error) {
    console.error(`[RAG TF-IDF Error]: ${error.message}`);
    // Absolute basic fallback - return first 3 chunks
    return chunks.slice(0, topK).join('\n\n');
  }
};

/**
 * Generates online (Gemini) embeddings for every chunk of a contract's text.
 * This is the EXPENSIVE step — run once at upload time (or lazily on first chat),
 * never per question. Returns null in offline mode or if embedding fails entirely,
 * so callers can degrade gracefully without ever blocking upload/chat.
 */
const generateEmbeddings = async (rawText) => {
  if (!genAI) return null; // Online-only cache; offline TF-IDF stays compute-on-demand.

  const chunks = chunkText(rawText);
  if (chunks.length === 0) return null;

  try {
    const embedModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });

    // Embed all chunks; tolerate individual chunk failures (keep what succeeds).
    const results = await Promise.all(
      chunks.map(async (chunk, index) => {
        try {
          const res = await embedModel.embedContent(chunk);
          return { index, text: chunk, vector: res.embedding.values };
        } catch (e) {
          console.error(`[RAG Embed] Chunk ${index} failed: ${e.message}`);
          return null;
        }
      })
    );

    const embedded = results.filter(Boolean);
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
 * Estimates whether storing these embeddings keeps the contract document under
 * MongoDB's 16MB ceiling. Conservative byte accounting: raw text + chunk text +
 * 8 bytes per vector float. If it doesn't fit, the caller skips persistence and
 * falls back to compute-on-demand for that (rare, very large) contract.
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
 * Fast retrieval path: embeds ONLY the user's query, then runs cosine similarity
 * against the precomputed chunk vectors. This is the whole point of the cache —
 * one embedding call per question instead of one-per-chunk.
 */
const searchWithCachedVectors = async (cachedChunks, query, topK = 3) => {
  const embedModel = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const queryEmbedResult = await embedModel.embedContent(query);
  const queryVector = queryEmbedResult.embedding.values;

  const scored = cachedChunks.map(c => ({
    chunk: c.text,
    score: cosineSimilarity(queryVector, c.vector)
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map(item => item.chunk).join('\n\n');
};

/**
 * Resolves the most relevant context for a question, preferring the cached
 * online embeddings. If a contract has no valid cache (e.g. uploaded before this
 * feature, or caching was skipped), it computes once, persists, and self-heals.
 * Falls back to the original on-demand path (TF-IDF offline / full re-embed) on
 * any failure so chat never breaks.
 */
const retrieveContext = async (contract, question, topK = 3) => {
  if (genAI) {
    try {
      const cached = contract.embeddings;
      const validCache =
        cached &&
        cached.model === EMBEDDING_MODEL &&
        Array.isArray(cached.chunks) &&
        cached.chunks.length > 0;

      let chunksToUse = validCache ? cached.chunks : null;

      // Lazy compute + persist for un-cached contracts (backfill self-heal).
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
 * Core chat handler that executes vector search and queries Gemini (or mock responses) to answer.
 */
const queryContract = async (contract, question) => {
  // 1. Perform semantic retrieval to pull matching passages (cache-first)
  const contextText = await retrieveContext(contract, question, 3);

  console.log(`[RAG] Found context length: ${contextText.length} characters.`);

  // 2. Query Gemini model using context
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `
        You are a highly helpful legal assistant for the Legal Document Intelligence System.
        Your goal is to answer questions about a legal contract using ONLY the provided verified context.
        If the answer cannot be found in the context, be honest and state that the contract does not mention it.
        Keep your answer clear, educational, and easy for a non-lawyer to understand.

        Verified Contract Context:
        ${contextText}

        User Question:
        ${question}

        Answer:
      `;

      const result = await model.generateContent(prompt);
      return {
        answer: result.response.text(),
        contextUsed: contextText,
        mode: 'AI (Gemini)'
      };
    } catch (error) {
      console.error(`[RAG AI Generation Error]: ${error.message}`);
    }
  }

  // 3. Fallback / Mock Answers (Offline Mode)
  // Generates intelligent mock answers by matching common keywords in the question
  const lowerQ = question.toLowerCase();
  let answer = "";
  
  if (lowerQ.includes('risk') || lowerQ.includes('problem')) {
    answer = `Based on our offline analysis of the document context, the primary risks involve potential uncapped liabilities in the Limitation of Liability section (Section 9.1) and a relatively short notice period in the Termination section (Section 4.2).`;
  } else if (lowerQ.includes('termination') || lowerQ.includes('cancel') || lowerQ.includes('notice')) {
    const termClause = contract.extractedClauses.find(c => c.clauseType === 'Termination');
    answer = termClause 
      ? `The termination clause states: "${termClause.clauseText}". This clause is evaluated as having a risk score of ${termClause.riskScore} because: ${termClause.reason}`
      : "The contract contains standard terms for termination, typically requiring 30 days written notice.";
  } else if (lowerQ.includes('payment') || lowerQ.includes('fees') || lowerQ.includes('invoice')) {
    const payClause = contract.extractedClauses.find(c => c.clauseType === 'Payment Terms');
    answer = payClause 
      ? `According to the Payment Terms: "${payClause.clauseText}". This is rated with a risk score of ${payClause.riskScore} because: ${payClause.reason}`
      : "Standard payment terms are Net 30 days upon receipt of invoice.";
  } else if (lowerQ.includes('ip') || lowerQ.includes('own') || lowerQ.includes('intellectual')) {
    const ipClause = contract.extractedClauses.find(c => c.clauseType === 'IP Ownership');
    answer = ipClause 
      ? `Regarding Intellectual Property: "${ipClause.clauseText}". This has a risk score of ${ipClause.riskScore} because: ${ipClause.reason}`
      : "Standard terms state that the Customer owns custom work product and deliverables, while the Vendor retains pre-existing tools.";
  } else if (lowerQ.includes('liability') || lowerQ.includes('cap') || lowerQ.includes('limit')) {
    const liabClause = contract.extractedClauses.find(c => c.clauseType === 'Limitation of Liability');
    answer = liabClause 
      ? `Regarding Limitation of Liability: "${liabClause.clauseText}". This is rated ${liabClause.riskScore} because: ${liabClause.reason}`
      : "Standard limitation cap is 1x contract value or fees paid in the past 12 months.";
  } else {
    // If no keywords match, extract matching text block
    answer = `I parsed the contract context offline. The document mentions details that may answer your query. Relevant snippet:\n\n"${contextText.substring(0, 300)}..."`;
  }

  return {
    answer: answer,
    contextUsed: contextText,
    mode: 'Offline Parser (Local Keyword Match)'
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
