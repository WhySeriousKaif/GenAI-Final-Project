// =========================================================================
// MockProvider — Offline heuristic implementation (no network)
// =========================================================================
// Implements the LLMProvider interface with regex/keyword heuristics so the
// system runs fully offline (e.g. no OPENAI_API_KEY). This is the "bulletproof"
// fallback the app has always had — now a first-class provider instead of
// scattered fallback branches.
//
// NOTE: clause extraction and offline answering are now data-driven registries
// (services/rules/*). This provider just orchestrates them.

const LLMProvider = require('./LLMProvider');
const { extractClauses } = require('../rules/clauseRules');
const { resolveOfflineAnswer } = require('../rules/answerRules');
const { computeOverallRiskScore } = require('../riskScoring');

class MockProvider extends LLMProvider {
  get canEmbed() {
    return false; // offline mode does not produce online embeddings
  }

  async analyzeClauses(rawText) {
    console.log('[MockProvider] Executing offline heuristic clause analyser');
    return extractClauses(rawText);
  }

  async summarize(rawText, clauses) {
    return generateMockSummary(rawText, clauses);
  }

  async answer(contextText, question, contract) {
    const clauses = (contract && contract.extractedClauses) || [];
    const answer = resolveOfflineAnswer(question, clauses, contextText);
    return { answer, mode: 'Offline Parser (Local Keyword Match)' };
  }
}

// =========================================================================
// HEURISTIC SUMMARY GENERATOR (offline executive summary)
// =========================================================================

function generateMockSummary(text, clauses) {
  // Preserve original behavior: default to 50 when there are no clauses.
  const avgScore = clauses.length > 0 ? computeOverallRiskScore(clauses) : 50;

  const parties = [];
  const matches = text.match(/between\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+and\s+|,)/);
  if (matches && matches[1]) {
    parties.push(matches[1].trim());
  } else {
    parties.push('Vendor Corporation');
  }

  const matchesSecond = text.match(/and\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+collectively|;|\.)/);
  if (matchesSecond && matchesSecond[1]) {
    parties.push(matchesSecond[1].trim());
  } else {
    parties.push('Customer Enterprises Inc.');
  }

  return {
    purpose: 'This agreement establishes terms for professional services, product licensing, and mutual business operations.',
    parties: parties,
    keyObligations: [
      'Provision of professional services and custom deliverables as described in Statement of Work.',
      'Timely payment of all undisputed fees within 30 days of invoice receipt.',
      'Strict compliance with standard intellectual property guidelines and mutual confidentiality.'
    ],
    topRisks: [
      'Potential high liability risk if uncapped liability or general indemnities exist.',
      'Operational threat from rapid unilateral termination options if active.'
    ],
    negotiationPoints: [
      'Ensure all liability is capped at a standard 12-month fees multiplier.',
      'Negotiate termination notice periods to be mutual and equal to at least 30 days.',
      'Confirm all custom intellectual property transfers fully upon invoice clearance.'
    ],
    overallRiskScore: avgScore
  };
}

module.exports = MockProvider;
