// Tests for the DTO serializers (P6): ensure internal fields never leak.
const { serializeContractDetail, serializeContractListItem } = require('../dto/contractDTO');
const { serializeUser } = require('../dto/userDTO');

describe('contractDTO', () => {
  const fakeDoc = {
    _id: 'c1',
    title: 'Deal.pdf',
    uploadedAt: new Date('2026-01-01'),
    overallRiskScore: 42,
    summary: { purpose: 'x' },
    extractedClauses: [{ clauseType: 'Indemnity' }],
    rawText: 'SECRET FULL CONTRACT TEXT',
    embeddings: { chunks: [{ vector: [1, 2, 3] }] }
  };

  test('detail omits rawText and embeddings', () => {
    const dto = serializeContractDetail(fakeDoc);
    expect(dto.rawText).toBeUndefined();
    expect(dto.embeddings).toBeUndefined();
    expect(dto._id).toBe('c1');
    expect(dto.title).toBe('Deal.pdf');
    expect(dto.summary).toEqual({ purpose: 'x' });
  });

  test('list item exposes only registry fields', () => {
    const dto = serializeContractListItem(fakeDoc);
    expect(Object.keys(dto).sort()).toEqual(
      ['_id', 'extractedClauses', 'overallRiskScore', 'title', 'uploadedAt'].sort()
    );
  });
});

describe('userDTO', () => {
  test('never serializes the password', () => {
    const dto = serializeUser({ _id: 'u1', username: 'a', email: 'a@b.c', role: 'admin', password: 'HASH' });
    expect(dto).toEqual({ id: 'u1', username: 'a', email: 'a@b.c', role: 'admin' });
    expect(dto.password).toBeUndefined();
  });
});
