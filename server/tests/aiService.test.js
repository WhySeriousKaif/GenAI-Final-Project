// Characterization tests for the AI service in MOCK mode (no Gemini key).
// These lock in the offline clause-extraction and summary behavior so later
// refactors (P2 provider abstraction, P3 rule engine) cannot silently change it.

const { analyzeContractText, generateExecutiveSummary } = require('../services/aiService');

const EXPECTED_CLAUSE_TYPES = [
  'Indemnity',
  'Limitation of Liability',
  'Governing Law',
  'Termination',
  'IP Ownership',
  'Payment Terms',
  'Confidentiality'
];

const VALID_RISK_TYPES = ['Financial', 'Operational', 'Legal', 'Reputational'];
const VALID_MARKET_STATUS = ['Favourable', 'Unfavourable', 'Unusual'];

describe('aiService.analyzeContractText (mock mode)', () => {
  test('returns all seven clause types', async () => {
    const clauses = await analyzeContractText('A generic contract with no special terms.');
    const types = clauses.map(c => c.clauseType).sort();
    expect(types).toEqual([...EXPECTED_CLAUSE_TYPES].sort());
  });

  test('every clause has valid, well-formed fields', async () => {
    const clauses = await analyzeContractText('Some contract text mentioning payment and termination.');
    for (const c of clauses) {
      expect(typeof c.clauseText).toBe('string');
      expect(c.clauseText.length).toBeGreaterThan(0);
      expect(c.riskScore).toBeGreaterThanOrEqual(0);
      expect(c.riskScore).toBeLessThanOrEqual(100);
      expect(VALID_RISK_TYPES).toContain(c.riskType);
      expect(VALID_MARKET_STATUS).toContain(c.marketStandardStatus);
    }
  });

  test('detects high-risk uncapped liability language', async () => {
    const risky = 'The liability of the vendor shall be unlimited under all circumstances for any damages whatsoever.';
    const clauses = await analyzeContractText(risky);
    const liability = clauses.find(c => c.clauseType === 'Limitation of Liability');
    expect(liability.riskScore).toBeGreaterThanOrEqual(70);
    expect(liability.marketStandardStatus).toBe('Unfavourable');
  });
});

describe('aiService.generateExecutiveSummary (mock mode)', () => {
  test('produces a structured summary with required fields', async () => {
    const clauses = await analyzeContractText('Generic agreement text.');
    const summary = await generateExecutiveSummary('Generic agreement text.', clauses);

    expect(typeof summary.purpose).toBe('string');
    expect(Array.isArray(summary.parties)).toBe(true);
    expect(Array.isArray(summary.keyObligations)).toBe(true);
    expect(Array.isArray(summary.topRisks)).toBe(true);
    expect(Array.isArray(summary.negotiationPoints)).toBe(true);
    expect(typeof summary.overallRiskScore).toBe('number');
  });
});
