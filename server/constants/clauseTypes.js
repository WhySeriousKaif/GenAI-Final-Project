// =========================================================================
// Shared Domain Constants (clause taxonomy, risk + market enums)
// =========================================================================
// Single source of truth for the clause vocabulary and classification enums
// that were previously hardcoded as string literals across the AI service,
// the Mongoose schema, and the RAG fallback.

const CLAUSE_TYPES = [
  'Indemnity',
  'Limitation of Liability',
  'Governing Law',
  'Termination',
  'IP Ownership',
  'Payment Terms',
  'Confidentiality'
];

const RISK_TYPES = ['Financial', 'Operational', 'Legal', 'Reputational'];

const MARKET_STATUS = ['Favourable', 'Unfavourable', 'Unusual'];

// Risk score bands (0-100)
const RISK_BANDS = {
  LOW_MAX: 30,
  MEDIUM_MAX: 70 // anything above is High
};

module.exports = { CLAUSE_TYPES, RISK_TYPES, MARKET_STATUS, RISK_BANDS };
