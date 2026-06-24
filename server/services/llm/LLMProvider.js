// =========================================================================
// LLMProvider — Abstract Interface (Dependency Inversion Principle)
// =========================================================================
// High-level services (clause analysis, RAG chat) depend on THIS contract,
// not on any concrete AI vendor SDK. Implementations: OpenAIProvider (online),
// MockProvider (offline heuristics), FallbackProvider (compose primary+fallback).
//
// Adding a new vendor (OpenAI, Anthropic, etc.) = new subclass, zero edits to
// the consuming services (Open/Closed Principle).

class LLMProvider {
  /** Whether this provider can produce numeric embeddings (online only). */
  get canEmbed() {
    return false;
  }

  /**
   * Extract legal clauses with risk + market-standard classification.
   * @param {string} rawText
   * @returns {Promise<Array<object>>}
   */
  async analyzeClauses(rawText) {
    throw new Error('LLMProvider.analyzeClauses() not implemented');
  }

  /**
   * Produce a one-page executive summary object.
   * @param {string} rawText
   * @param {Array<object>} clauses
   * @returns {Promise<object>}
   */
  async summarize(rawText, clauses) {
    throw new Error('LLMProvider.summarize() not implemented');
  }

  /**
   * Embed an array of texts into vectors. Order-aligned with input; a failed
   * item may be null. Throws/should be guarded by `canEmbed` for offline providers.
   * @param {string[]} texts
   * @returns {Promise<Array<number[]|null>>}
   */
  async embed(texts) {
    throw new Error('LLMProvider.embed() not supported by this provider');
  }

  /**
   * Answer a question given retrieved context.
   * @param {string} contextText
   * @param {string} question
   * @param {object} contract - full contract (used by offline keyword fallback)
   * @returns {Promise<{answer: string, mode: string}>}
   */
  async answer(contextText, question, contract) {
    throw new Error('LLMProvider.answer() not implemented');
  }
}

module.exports = LLMProvider;
