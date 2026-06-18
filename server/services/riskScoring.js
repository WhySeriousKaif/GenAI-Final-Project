// =========================================================================
// Risk Scoring Helper (shared domain logic)
// =========================================================================
// Single home for the "average the clause risk scores" calculation that was
// duplicated between the upload controller and the mock summary generator.

/**
 * Computes the overall (average) risk score from a set of clauses.
 * @param {Array<{riskScore:number}>} clauses
 * @returns {number} rounded 0-100 average, or 0 when there are no clauses.
 */
const computeOverallRiskScore = (clauses = []) => {
  if (!clauses.length) return 0;
  const sum = clauses.reduce((acc, c) => acc + Number(c.riskScore), 0);
  return Math.round(sum / clauses.length);
};

module.exports = { computeOverallRiskScore };
