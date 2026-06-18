// =========================================================================
// Centralized AI / Gemini Configuration (DRY)
// =========================================================================
// Single source of truth for: whether the online Gemini engine is enabled,
// the shared SDK client (singleton), model identifiers, and all RAG/analysis
// tunables. Previously this detection logic and these magic numbers were
// duplicated across aiService.js, ragService.js, and server.js.

const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- Model identifiers ---------------------------------------------------
const CHAT_MODEL = 'gemini-2.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';

// --- RAG / analysis tunables ---------------------------------------------
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const TOP_K = 3;
const MAX_ANALYSIS_CHARS = 40000; // clause-extraction prompt input cap
const MAX_SUMMARY_CHARS = 15000;  // executive-summary prompt input cap

// MongoDB caps a single document at 16MB. Stay under 15MB before caching vectors.
const MAX_DOC_BYTES = 15 * 1024 * 1024;

// --- Gemini enablement & client singleton --------------------------------
const apiKey = process.env.GEMINI_API_KEY;
const isGeminiEnabled = !!(
  apiKey &&
  apiKey.trim() !== '' &&
  apiKey !== 'your_gemini_api_key_here'
);

let _client = null;

/**
 * Returns the shared GoogleGenerativeAI client, or null in offline/mock mode.
 * Lazily instantiated and memoized so the whole app shares one client.
 */
const getGeminiClient = () => {
  if (!isGeminiEnabled) return null;
  if (!_client) {
    _client = new GoogleGenerativeAI(apiKey);
  }
  return _client;
};

module.exports = {
  CHAT_MODEL,
  EMBEDDING_MODEL,
  CHUNK_SIZE,
  CHUNK_OVERLAP,
  TOP_K,
  MAX_ANALYSIS_CHARS,
  MAX_SUMMARY_CHARS,
  MAX_DOC_BYTES,
  isGeminiEnabled,
  getGeminiClient
};
