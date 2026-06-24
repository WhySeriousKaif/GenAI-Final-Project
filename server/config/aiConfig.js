// =========================================================================
// Centralized AI / OpenAI Configuration (DRY)
// =========================================================================
// Single source of truth for: whether the online OpenAI engine is enabled,
// the shared SDK client (singleton), model identifiers, and all RAG/analysis
// tunables. Previously this detection logic and these magic numbers were
// duplicated across aiService.js, ragService.js, and server.js.

const OpenAI = require('openai');

// --- Model identifiers ---------------------------------------------------
const CHAT_MODEL = 'gpt-4o-mini';
const EMBEDDING_MODEL = 'text-embedding-3-small';

// --- RAG / analysis tunables ---------------------------------------------
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 200;
const TOP_K = 3;
const MAX_ANALYSIS_CHARS = 40000; // clause-extraction prompt input cap
const MAX_SUMMARY_CHARS = 15000;  // executive-summary prompt input cap

// MongoDB caps a single document at 16MB. Stay under 15MB before caching vectors.
const MAX_DOC_BYTES = 15 * 1024 * 1024;

// --- OpenAI enablement & client singleton --------------------------------
const apiKey = process.env.OPENAI_API_KEY;
const isOpenAIEnabled = !!(
  apiKey &&
  apiKey.trim() !== '' &&
  apiKey !== 'your_openai_api_key_here'
);

let _client = null;

/**
 * Returns the shared OpenAI client, or null in offline/mock mode.
 * Lazily instantiated and memoized so the whole app shares one client.
 */
const getOpenAIClient = () => {
  if (!isOpenAIEnabled) return null;
  if (!_client) {
    _client = new OpenAI({ apiKey });
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
  isOpenAIEnabled,
  getOpenAIClient
};
