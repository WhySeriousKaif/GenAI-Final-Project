// Tests for the data-driven rule registries (P3).
const { CLAUSE_RULES, extractClauses } = require('../services/rules/clauseRules');
const { resolveOfflineAnswer } = require('../services/rules/answerRules');
const { getExtractor, supportedExtensions } = require('../services/rules/extractorRegistry');
const { CLAUSE_TYPES } = require('../constants/clauseTypes');

describe('clauseRules engine', () => {
  test('registry covers exactly the canonical clause taxonomy', () => {
    const ruleTypes = CLAUSE_RULES.map((r) => r.clauseType).sort();
    expect(ruleTypes).toEqual([...CLAUSE_TYPES].sort());
  });

  test('extractClauses always returns one clause per rule', () => {
    const clauses = extractClauses('an empty-ish contract');
    expect(clauses).toHaveLength(CLAUSE_RULES.length);
  });

  test('high-risk flag fires for uncapped liability language', () => {
    const clauses = extractClauses('liability shall be unlimited for all damages whatsoever here.');
    const liab = clauses.find((c) => c.clauseType === 'Limitation of Liability');
    expect(liab.riskScore).toBe(90);
    expect(liab.marketStandardStatus).toBe('Unfavourable');
  });

  test('fallback clause used when no regex match', () => {
    const clauses = extractClauses('xyz');
    const termination = clauses.find((c) => c.clauseType === 'Termination');
    expect(termination.sectionNumber).toBe('Article 4.2'); // fallback section
    expect(termination.riskScore).toBe(25);
  });
});

describe('answerRules resolver', () => {
  const clauses = [{ clauseType: 'Termination', clauseText: 'T', riskScore: 30, reason: 'r' }];

  test('matches termination intent', () => {
    expect(resolveOfflineAnswer('what is the notice period?', clauses)).toMatch(/termination clause/i);
  });

  test('falls back to context snippet when no keyword matches', () => {
    const ans = resolveOfflineAnswer('hello there', [], 'some context');
    expect(ans).toMatch(/parsed the contract context offline/i);
  });
});

describe('extractorRegistry', () => {
  test('supports pdf and docx', () => {
    expect(supportedExtensions().sort()).toEqual(['.docx', '.pdf']);
  });

  test('returns a handler for known extensions and undefined for unknown', () => {
    expect(typeof getExtractor('.pdf')).toBe('function');
    expect(getExtractor('.txt')).toBeUndefined();
  });
});
