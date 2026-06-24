// =========================================================================
// AI Service (Facade over the LLM provider layer)
// =========================================================================
// This module is now a thin facade. All vendor-specific logic lives behind the
// LLMProvider abstraction (services/llm). Consumers keep the same API
// (analyzeContractText / generateExecutiveSummary) while the implementation —
// OpenAI online with offline mock fallback — is selected by the provider factory.

const { getProvider } = require('./llm');

/**
 * Extracts clauses with risk + market-standard classification.
 * @param {string} rawText
 */
const analyzeContractText = (rawText) => getProvider().analyzeClauses(rawText);

/**
 * Generates a one-page executive summary.
 * @param {string} rawText
 * @param {Array<object>} clauses
 */
const generateExecutiveSummary = (rawText, clauses) => getProvider().summarize(rawText, clauses);

module.exports = {
  analyzeContractText,
  generateExecutiveSummary
};
