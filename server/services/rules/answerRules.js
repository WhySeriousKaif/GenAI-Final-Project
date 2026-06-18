// =========================================================================
// Offline Chat Answer Rule Registry (Open/Closed Principle)
// =========================================================================
// Replaces the if/else-if keyword chain in the offline chat fallback with an
// ordered registry. First rule whose keywords match the question wins. A new
// intent = a new entry; the resolver loop never changes.
//
// Behavior is preserved verbatim, including the original substring matching
// (e.g. 'ip'/'own'/'limit'), so existing characterization tests stay green.

const ANSWER_RULES = [
  {
    keywords: ['risk', 'problem'],
    handler: () =>
      'Based on our offline analysis of the document context, the primary risks involve potential uncapped liabilities in the Limitation of Liability section (Section 9.1) and a relatively short notice period in the Termination section (Section 4.2).'
  },
  {
    keywords: ['termination', 'cancel', 'notice'],
    handler: (clauses) => {
      const c = clauses.find((x) => x.clauseType === 'Termination');
      return c
        ? `The termination clause states: "${c.clauseText}". This clause is evaluated as having a risk score of ${c.riskScore} because: ${c.reason}`
        : 'The contract contains standard terms for termination, typically requiring 30 days written notice.';
    }
  },
  {
    keywords: ['payment', 'fees', 'invoice'],
    handler: (clauses) => {
      const c = clauses.find((x) => x.clauseType === 'Payment Terms');
      return c
        ? `According to the Payment Terms: "${c.clauseText}". This is rated with a risk score of ${c.riskScore} because: ${c.reason}`
        : 'Standard payment terms are Net 30 days upon receipt of invoice.';
    }
  },
  {
    keywords: ['ip', 'own', 'intellectual'],
    handler: (clauses) => {
      const c = clauses.find((x) => x.clauseType === 'IP Ownership');
      return c
        ? `Regarding Intellectual Property: "${c.clauseText}". This has a risk score of ${c.riskScore} because: ${c.reason}`
        : 'Standard terms state that the Customer owns custom work product and deliverables, while the Vendor retains pre-existing tools.';
    }
  },
  {
    keywords: ['liability', 'cap', 'limit'],
    handler: (clauses) => {
      const c = clauses.find((x) => x.clauseType === 'Limitation of Liability');
      return c
        ? `Regarding Limitation of Liability: "${c.clauseText}". This is rated ${c.riskScore} because: ${c.reason}`
        : 'Standard limitation cap is 1x contract value or fees paid in the past 12 months.';
    }
  }
];

/**
 * Resolves an offline answer string for a question.
 * Falls back to a context snippet when no keyword rule matches.
 */
const resolveOfflineAnswer = (question, clauses = [], contextText = '') => {
  const lowerQ = question.toLowerCase();
  const rule = ANSWER_RULES.find((r) => r.keywords.some((k) => lowerQ.includes(k)));

  if (rule) return rule.handler(clauses, contextText);

  return `I parsed the contract context offline. The document mentions details that may answer your query. Relevant snippet:\n\n"${(contextText || '').substring(0, 300)}..."`;
};

module.exports = { ANSWER_RULES, resolveOfflineAnswer };
