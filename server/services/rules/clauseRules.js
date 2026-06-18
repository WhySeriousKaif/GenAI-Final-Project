// =========================================================================
// Clause Extraction Rule Registry + Engine (Open/Closed Principle)
// =========================================================================
// The offline heuristic clause extractor was a ~200-line if/else ladder with
// one hand-written block per clause type. It is now a declarative registry: a
// new clause type = a new entry here, with ZERO changes to the engine.
//
// Each rule declares:
//   - clauseType, riskType
//   - regex            : how to locate the clause text in the document
//   - sectionWhenFound : section label to attach when located
//   - flag(lowerText)  : risk predicate (e.g. "is the liability uncapped?")
//   - high / low       : outcome when the regex matches and flag is true / false
//   - fallback         : outcome when the regex does not match at all

const CLAUSE_RULES = [
  {
    clauseType: 'Indemnity',
    riskType: 'Legal',
    regex: /(?:indemnity|indemnify|indemnification)[^.]{30,600}\./i,
    sectionWhenFound: 'Section 8.2',
    flag: (t) => t.includes('unlimited') || t.includes('solely responsible') || t.includes('consequential damages'),
    high: {
      riskScore: 85,
      reason: 'One-sided indemnity exposing customer to uncapped third-party claims.',
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Exceeds standard risk sharing policies.'
    },
    low: {
      riskScore: 45,
      reason: 'Standard mutual intellectual property infringement indemnity clauses.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Matches standard mutual liability templates.'
    },
    fallback: {
      clauseText: 'Each party shall defend, indemnify, and hold harmless the other party from and against any and all claims, actions, suits, or demands arising out of material breaches of representations or warranties.',
      sectionNumber: 'Article 8',
      riskScore: 25,
      reason: 'Standard mutual indemnity clause. Minimizes legal friction.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard mutual setup.'
    }
  },
  {
    clauseType: 'Limitation of Liability',
    riskType: 'Financial',
    regex: /(?:limit|limitation|liability|cap)[^.]{30,600}\./i,
    sectionWhenFound: 'Section 9.1',
    flag: (t) => t.includes('unlimited') || !t.includes('cap') || t.includes('no event shall either'),
    high: {
      riskScore: 90,
      reason: 'No financial cap on liability was detected, creating infinite financial exposure.',
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Deviates from standard contract value cap.'
    },
    low: {
      riskScore: 35,
      reason: 'Liability is capped at 12 months fees, which aligns with standard corporate contracts.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Aligned with Net-Fees values.'
    },
    fallback: {
      clauseText: "In no event shall either party's aggregate liability exceed the total amounts paid by customer in the twelve (12) months preceding the incident.",
      sectionNumber: 'Section 10.2',
      riskScore: 30,
      reason: 'Standard 12-month fee cap is in place. Limits exposure.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard fee-cap limitation.'
    }
  },
  {
    clauseType: 'Governing Law',
    riskType: 'Legal',
    regex: /(?:governing law|jurisdiction|arbitration|venue)[^.]{30,400}\./i,
    sectionWhenFound: 'Section 14.5',
    flag: (t) => t.includes('london') || t.includes('switzerland') || t.includes('china') || t.includes('foreign'),
    high: {
      riskScore: 65,
      reason: 'Governing law is set to a foreign jurisdiction, increasing potential dispute resolution costs.',
      marketStandardStatus: 'Unusual',
      marketComparisonReason: 'Non-standard jurisdiction selected.'
    },
    low: {
      riskScore: 20,
      reason: 'Standard domestic jurisdiction. Low legal risk.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard local governance.'
    },
    fallback: {
      clauseText: 'This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.',
      sectionNumber: 'Section 12.1',
      riskScore: 15,
      reason: 'Governing law set to Delaware, standard for US corporate contracts.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Highly standard corporate state.'
    }
  },
  {
    clauseType: 'Termination',
    riskType: 'Operational',
    regex: /(?:terminate|termination|notice|convenience)[^.]{30,500}\./i,
    sectionWhenFound: 'Section 4.2',
    flag: (t) => t.includes('15 days') || t.includes('immediate') || t.includes('7 days'),
    high: {
      riskScore: 75,
      reason: 'The notice period for termination is extremely short, risking operational interruption.',
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Shorter than standard 30-day notice.'
    },
    low: {
      riskScore: 30,
      reason: 'Contains standard 30-day notice period for termination for convenience.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Matches 30-day baseline.'
    },
    fallback: {
      clauseText: 'Either party may terminate this agreement for convenience upon 30 days written notice to the other party.',
      sectionNumber: 'Article 4.2',
      riskScore: 25,
      reason: 'Balanced 30-day notice for convenience termination.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard notice period.'
    }
  },
  {
    clauseType: 'IP Ownership',
    riskType: 'Legal',
    regex: /(?:intellectual property|ip ownership|copyright|patent)[^.]{30,500}\./i,
    sectionWhenFound: 'Section 7.1',
    flag: (t) => t.includes('vendor owns') || t.includes('provider retains all rights') || t.includes('no work product transfer'),
    high: {
      riskScore: 70,
      reason: 'Vendor retains all intellectual property in custom work product created for Customer.',
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Custom deliverables ownership should belong to client.'
    },
    low: {
      riskScore: 20,
      reason: 'Customer owns deliverables, which is favorable for client-funded projects.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Matches client ownership expectations.'
    },
    fallback: {
      clauseText: 'Vendor assigns all rights, titles, and interests in the custom deliverables to the Customer upon full payment.',
      sectionNumber: 'Section 6',
      riskScore: 20,
      reason: 'Standard intellectual property assignment following fee execution.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard client-side transfer.'
    }
  },
  {
    clauseType: 'Payment Terms',
    riskType: 'Financial',
    regex: /(?:payment|invoice|net|fees|billing)[^.]{30,500}\./i,
    sectionWhenFound: 'Section 3.3',
    flag: (t) => t.includes('net 60') || t.includes('net 90') || t.includes('90 days'),
    high: {
      riskScore: 60,
      reason: 'Payment period of 60-90 days strains vendor cash flows unnecessarily.',
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Longer than standard 30 days.'
    },
    low: {
      riskScore: 30,
      reason: 'Standard payment timeline (Net 30 days) is specified.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Matches 30-day baseline.'
    },
    fallback: {
      clauseText: 'Customer shall pay all undisputed invoices within thirty (30) days of receipt.',
      sectionNumber: 'Section 3.1',
      riskScore: 20,
      reason: 'Standard Net 30 payment terms.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Matches standard 30-day terms.'
    }
  },
  {
    clauseType: 'Confidentiality',
    riskType: 'Reputational',
    regex: /(?:confidential|confidentiality|non-disclosure|disclosure)[^.]{30,500}\./i,
    sectionWhenFound: 'Section 6.1',
    flag: (t) => t.includes('one-way') || t.includes('unilateral') || t.includes('disclose only'),
    high: {
      riskScore: 65,
      reason: "One-sided confidentiality only protects the vendor's data, leaving client exposed.",
      marketStandardStatus: 'Unfavourable',
      marketComparisonReason: 'Should be mutual rather than unilateral.'
    },
    low: {
      riskScore: 20,
      reason: 'Mutual confidentiality agreement is in place, protecting both parties equally.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard mutual NDA format.'
    },
    fallback: {
      clauseText: 'Each party agrees to hold in confidence all proprietary information disclosed by the other party and use it only for executing this agreement.',
      sectionNumber: 'Section 5',
      riskScore: 15,
      reason: 'Standard mutual confidentiality protection.',
      marketStandardStatus: 'Favourable',
      marketComparisonReason: 'Standard mutual NDA clause.'
    }
  }
];

/**
 * Runs every clause rule over the text, producing one clause object per rule.
 * Replaces the original hand-written if/else ladder with a single loop.
 */
const extractClauses = (text) => {
  const lower = text.toLowerCase();

  return CLAUSE_RULES.map((rule) => {
    const match = text.match(rule.regex);

    if (match) {
      const outcome = rule.flag(lower) ? rule.high : rule.low;
      return {
        clauseType: rule.clauseType,
        clauseText: match[0].trim(),
        sectionNumber: rule.sectionWhenFound,
        riskType: rule.riskType,
        riskScore: outcome.riskScore,
        reason: outcome.reason,
        marketStandardStatus: outcome.marketStandardStatus,
        marketComparisonReason: outcome.marketComparisonReason
      };
    }

    // No regex match → use the rule's safe default clause.
    return {
      clauseType: rule.clauseType,
      clauseText: rule.fallback.clauseText,
      sectionNumber: rule.fallback.sectionNumber,
      riskType: rule.riskType,
      riskScore: rule.fallback.riskScore,
      reason: rule.fallback.reason,
      marketStandardStatus: rule.fallback.marketStandardStatus,
      marketComparisonReason: rule.fallback.marketComparisonReason
    };
  });
};

module.exports = { CLAUSE_RULES, extractClauses };
