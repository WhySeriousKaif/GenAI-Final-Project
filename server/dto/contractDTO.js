// =========================================================================
// Contract DTOs (API boundary serializers)
// =========================================================================
// Decouples the HTTP response shape from the Mongoose schema. Endpoints return
// these explicit projections instead of raw documents, so internal fields
// (rawText, cached embeddings, __v) never leak to clients and schema changes
// don't silently change the API.

/** Full detail view — everything the UI needs, minus heavy internal fields. */
const serializeContractDetail = (contract) => ({
  _id: contract._id,
  title: contract.title,
  uploadedAt: contract.uploadedAt,
  overallRiskScore: contract.overallRiskScore,
  summary: contract.summary,
  extractedClauses: contract.extractedClauses
  // intentionally omitted: rawText (large, unused by UI), embeddings (select:false), __v
});

/** Compact list item for the contracts registry. */
const serializeContractListItem = (contract) => ({
  _id: contract._id,
  title: contract.title,
  uploadedAt: contract.uploadedAt,
  overallRiskScore: contract.overallRiskScore,
  extractedClauses: contract.extractedClauses // only clauseType is selected by the query
});

const serializeContractList = (contracts) => contracts.map(serializeContractListItem);

module.exports = {
  serializeContractDetail,
  serializeContractListItem,
  serializeContractList
};
