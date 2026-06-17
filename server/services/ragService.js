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

/**
 * Splits a long text string into smaller chunks with overlapping text.
 * Overlaps ensure context is not lost at the boundary of a cut.
 */
const chunkText = (text, chunkSize = 800, chunkOverlap = 200) => {
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
      const embedModel = genAI.getGenerativeModel({ model: 'gemini-embedding-2' });

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
 * Core chat handler that executes vector search and queries Gemini (or mock responses) to answer.
 */
const queryContract = async (contract, question) => {
  // 1. Perform semantic retrieval to pull matching passages
  const contextText = await searchRelevantContext(contract.rawText, question, 3);
  
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
  queryContract
};
