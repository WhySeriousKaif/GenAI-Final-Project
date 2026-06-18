// Characterization tests for the RAG service pure helpers and the offline
// chat path. No DB or network required (contract is a plain object).

const {
  chunkText,
  cosineSimilarity,
  fitsDocLimit,
  queryContract
} = require('../services/ragService');

describe('ragService.chunkText', () => {
  test('splits long text into overlapping chunks', () => {
    const text = 'a '.repeat(1000); // 2000 chars
    const chunks = chunkText(text, 800, 200);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].length).toBeLessThanOrEqual(800);
  });

  test('normalizes whitespace', () => {
    const chunks = chunkText('hello    world\n\n\nfoo', 800, 200);
    expect(chunks[0]).toBe('hello world foo');
  });
});

describe('ragService.cosineSimilarity', () => {
  test('identical vectors score 1', () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1, 5);
  });
  test('orthogonal vectors score 0', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5);
  });
  test('zero vector yields 0 (no NaN)', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0);
  });
});

describe('ragService.fitsDocLimit', () => {
  test('small embeddings fit', () => {
    const emb = { chunks: [{ text: 'abc', vector: [0.1, 0.2, 0.3] }] };
    expect(fitsDocLimit('short raw text', emb)).toBe(true);
  });
  test('oversized embeddings do not fit', () => {
    const huge = { chunks: [{ text: 'x'.repeat(20 * 1024 * 1024), vector: [] }] };
    expect(fitsDocLimit('x', huge)).toBe(false);
  });
  test('missing embeddings are rejected', () => {
    expect(fitsDocLimit('x', null)).toBe(false);
  });
});

describe('ragService.queryContract (offline mode)', () => {
  const contract = {
    title: 'Test Contract',
    rawText: 'This agreement includes termination with 30 days notice. Payment is Net 30. Liability is capped.',
    extractedClauses: [
      { clauseType: 'Termination', clauseText: 'Either party may terminate on 30 days notice.', riskScore: 25, reason: 'Standard notice.' }
    ]
  };

  test('answers a risk question via offline parser', async () => {
    const res = await queryContract(contract, 'What are the risks?');
    expect(res.mode).toMatch(/Offline/);
    expect(typeof res.answer).toBe('string');
    expect(res.answer.length).toBeGreaterThan(0);
    expect(typeof res.contextUsed).toBe('string');
  });

  test('uses the termination clause for termination questions', async () => {
    const res = await queryContract(contract, 'What is the termination notice period?');
    expect(res.answer).toMatch(/terminat/i);
  });
});
