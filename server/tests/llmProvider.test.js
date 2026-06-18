// Tests for the LLM provider abstraction (P2).
// Uses a fake Gemini client — no network. Verifies the online provider, the
// offline mock provider, and the fallback-degradation composition.

const GeminiProvider = require('../services/llm/GeminiProvider');
const MockProvider = require('../services/llm/MockProvider');
const FallbackProvider = require('../services/llm/FallbackProvider');

const fakeClient = (overrides = {}) => ({
  getGenerativeModel: () => ({
    generateContent: async (prompt) => ({
      response: {
        text: () =>
          prompt.includes('Executive Summary')
            ? '{"purpose":"p","parties":[],"keyObligations":[],"topRisks":[],"negotiationPoints":[],"overallRiskScore":40}'
            : prompt.includes('legal assistant')
            ? 'A Gemini answer.'
            : '[{"clauseType":"Indemnity","clauseText":"t","sectionNumber":"S1","riskType":"Legal","riskScore":50,"reason":"r","marketStandardStatus":"Favourable","marketComparisonReason":"m"}]'
      }
    }),
    embedContent: async () => ({ embedding: { values: [0.1, 0.2, 0.3] } }),
    ...overrides
  })
});

describe('GeminiProvider (online, faked client)', () => {
  const gp = new GeminiProvider(fakeClient());

  test('canEmbed is true', () => expect(gp.canEmbed).toBe(true));

  test('analyzeClauses parses JSON array', async () => {
    const clauses = await gp.analyzeClauses('text');
    expect(Array.isArray(clauses)).toBe(true);
    expect(clauses[0].clauseType).toBe('Indemnity');
  });

  test('summarize parses JSON object', async () => {
    const sum = await gp.summarize('Executive Summary', []);
    expect(sum.overallRiskScore).toBe(40);
  });

  test('embed returns order-aligned vectors', async () => {
    const vecs = await gp.embed(['a', 'b']);
    expect(vecs).toHaveLength(2);
    expect(vecs[0]).toEqual([0.1, 0.2, 0.3]);
  });

  test('answer returns Gemini mode', async () => {
    const res = await gp.answer('ctx', 'legal assistant query');
    expect(res.mode).toBe('AI (Gemini)');
    expect(res.answer).toMatch(/Gemini/);
  });
});

describe('FallbackProvider (degradation)', () => {
  const exploding = {
    get canEmbed() { return true; },
    analyzeClauses: async () => { throw new Error('boom'); },
    summarize: async () => { throw new Error('boom'); },
    answer: async () => { throw new Error('boom'); },
    embed: async () => [null]
  };
  const fb = new FallbackProvider(exploding, new MockProvider());

  test('falls back to mock clauses on primary failure', async () => {
    const clauses = await fb.analyzeClauses('generic contract text');
    expect(clauses).toHaveLength(7);
  });

  test('falls back to mock answer on primary failure', async () => {
    const res = await fb.answer('ctx', 'what are the risks?', { extractedClauses: [] });
    expect(res.mode).toMatch(/Offline/);
  });
});
