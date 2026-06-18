// Tests for the risk-scoring helper and the contract ingestion orchestration (P4).
// Heavy dependencies (Mongoose model, Neo4j, text extraction) are mocked so the
// pipeline logic is tested in isolation without a database or files.

const { computeOverallRiskScore } = require('../services/riskScoring');

describe('computeOverallRiskScore', () => {
  test('averages and rounds clause scores', () => {
    expect(computeOverallRiskScore([{ riskScore: 10 }, { riskScore: 21 }])).toBe(16); // 15.5 -> 16
  });
  test('returns 0 for no clauses', () => {
    expect(computeOverallRiskScore([])).toBe(0);
  });
});

// --- Ingestion pipeline (mocked deps) ------------------------------------
jest.mock('../services/textExtractor', () => ({
  extractTextFromFile: jest.fn()
}));
jest.mock('../services/neo4jService', () => ({
  syncContractToGraph: jest.fn().mockResolvedValue(true)
}));
jest.mock('../models/Contract', () => {
  // Fake Mongoose model: stores props, save() resolves to itself with an _id.
  return function Contract(props) {
    Object.assign(this, props);
    this._id = 'fake-id-123';
    this.save = jest.fn().mockResolvedValue(this);
  };
});

const { extractTextFromFile } = require('../services/textExtractor');
const { syncContractToGraph } = require('../services/neo4jService');
const { ingestContract, ExtractionError } = require('../services/contractIngestionService');

describe('ingestContract', () => {
  beforeEach(() => jest.clearAllMocks());

  test('runs the full pipeline and returns a saved contract', async () => {
    extractTextFromFile.mockResolvedValue('A contract with payment and termination terms.');

    const result = await ingestContract('/tmp/x.pdf', 'x.pdf');

    expect(result._id).toBe('fake-id-123');
    expect(result.title).toBe('x.pdf');
    expect(result.extractedClauses).toHaveLength(7); // offline mock provider
    expect(typeof result.overallRiskScore).toBe('number');
    expect(syncContractToGraph).toHaveBeenCalledTimes(1);
  });

  test('wraps extraction failures as a 422 ExtractionError', async () => {
    extractTextFromFile.mockRejectedValue(new Error('PDF is empty'));

    await expect(ingestContract('/tmp/x.pdf', 'x.pdf')).rejects.toThrow(ExtractionError);
    await expect(ingestContract('/tmp/x.pdf', 'x.pdf')).rejects.toMatchObject({ statusCode: 422 });
    expect(syncContractToGraph).not.toHaveBeenCalled();
  });
});
