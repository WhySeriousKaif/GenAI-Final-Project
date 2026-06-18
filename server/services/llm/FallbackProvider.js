// =========================================================================
// FallbackProvider — Resilience composite (Strategy + graceful degradation)
// =========================================================================
// Wraps a primary provider (Gemini) and a fallback (Mock). Each operation tries
// the primary; on ANY failure it transparently degrades to the fallback. This
// preserves the app's original "never crash offline / on API error" guarantee,
// now expressed as a single reusable composition instead of try/catch scattered
// through every service method.

const LLMProvider = require('./LLMProvider');

class FallbackProvider extends LLMProvider {
  constructor(primary, fallback) {
    super();
    this.primary = primary;
    this.fallback = fallback;
  }

  // Embedding capability follows the primary (online) provider.
  get canEmbed() {
    return this.primary.canEmbed;
  }

  async analyzeClauses(rawText) {
    try {
      return await this.primary.analyzeClauses(rawText);
    } catch (error) {
      console.error(`[AI] Clause extraction failed, using offline fallback: ${error.message}`);
      return this.fallback.analyzeClauses(rawText);
    }
  }

  async summarize(rawText, clauses) {
    try {
      return await this.primary.summarize(rawText, clauses);
    } catch (error) {
      console.error(`[AI] Summary failed, using offline fallback: ${error.message}`);
      return this.fallback.summarize(rawText, clauses);
    }
  }

  // Embeddings come ONLY from the primary; failures propagate as null so the
  // caller (ragService) can decide to skip caching / use TF-IDF retrieval.
  async embed(texts) {
    return this.primary.embed(texts);
  }

  async answer(contextText, question, contract) {
    try {
      return await this.primary.answer(contextText, question, contract);
    } catch (error) {
      console.error(`[AI] Chat answer failed, using offline fallback: ${error.message}`);
      return this.fallback.answer(contextText, question, contract);
    }
  }
}

module.exports = FallbackProvider;
