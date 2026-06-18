// =========================================================================
// MockProvider — Offline heuristic implementation (no network)
// =========================================================================
// Implements the LLMProvider interface with regex/keyword heuristics so the
// system runs fully offline (e.g. no GEMINI_API_KEY). This is the "bulletproof"
// fallback the app has always had — now a first-class provider instead of
// scattered fallback branches.
//
// NOTE: the clause-extraction heuristics here are replaced by a data-driven
// rule engine in Phase 3; this file currently preserves the original behavior.

const LLMProvider = require('./LLMProvider');

class MockProvider extends LLMProvider {
  get canEmbed() {
    return false; // offline mode does not produce online embeddings
  }

  async analyzeClauses(rawText) {
    console.log('[MockProvider] Executing offline heuristic clause analyser');
    return generateMockClauses(rawText);
  }

  async summarize(rawText, clauses) {
    return generateMockSummary(rawText, clauses);
  }

  async answer(contextText, question, contract) {
    const lowerQ = question.toLowerCase();
    const clauses = (contract && contract.extractedClauses) || [];
    const find = (type) => clauses.find((c) => c.clauseType === type);
    let answer = '';

    if (lowerQ.includes('risk') || lowerQ.includes('problem')) {
      answer = `Based on our offline analysis of the document context, the primary risks involve potential uncapped liabilities in the Limitation of Liability section (Section 9.1) and a relatively short notice period in the Termination section (Section 4.2).`;
    } else if (lowerQ.includes('termination') || lowerQ.includes('cancel') || lowerQ.includes('notice')) {
      const termClause = find('Termination');
      answer = termClause
        ? `The termination clause states: "${termClause.clauseText}". This clause is evaluated as having a risk score of ${termClause.riskScore} because: ${termClause.reason}`
        : 'The contract contains standard terms for termination, typically requiring 30 days written notice.';
    } else if (lowerQ.includes('payment') || lowerQ.includes('fees') || lowerQ.includes('invoice')) {
      const payClause = find('Payment Terms');
      answer = payClause
        ? `According to the Payment Terms: "${payClause.clauseText}". This is rated with a risk score of ${payClause.riskScore} because: ${payClause.reason}`
        : 'Standard payment terms are Net 30 days upon receipt of invoice.';
    } else if (lowerQ.includes('ip') || lowerQ.includes('own') || lowerQ.includes('intellectual')) {
      const ipClause = find('IP Ownership');
      answer = ipClause
        ? `Regarding Intellectual Property: "${ipClause.clauseText}". This has a risk score of ${ipClause.riskScore} because: ${ipClause.reason}`
        : 'Standard terms state that the Customer owns custom work product and deliverables, while the Vendor retains pre-existing tools.';
    } else if (lowerQ.includes('liability') || lowerQ.includes('cap') || lowerQ.includes('limit')) {
      const liabClause = find('Limitation of Liability');
      answer = liabClause
        ? `Regarding Limitation of Liability: "${liabClause.clauseText}". This is rated ${liabClause.riskScore} because: ${liabClause.reason}`
        : 'Standard limitation cap is 1x contract value or fees paid in the past 12 months.';
    } else {
      answer = `I parsed the contract context offline. The document mentions details that may answer your query. Relevant snippet:\n\n"${(contextText || '').substring(0, 300)}..."`;
    }

    return { answer, mode: 'Offline Parser (Local Keyword Match)' };
  }
}

// =========================================================================
// HEURISTIC GENERATORS (preserved from the original aiService mock engine)
// =========================================================================

function generateMockClauses(text) {
  const lowercaseText = text.toLowerCase();
  const clauses = [];

  // 1. Indemnity
  const indemnityMatch = text.match(/(?:indemnity|indemnify|indemnification)[^.]{30,600}\./i);
  if (indemnityMatch) {
    const isUncapped = lowercaseText.includes('unlimited') || lowercaseText.includes('solely responsible') || lowercaseText.includes('consequential damages');
    clauses.push({
      clauseType: "Indemnity",
      clauseText: indemnityMatch[0].trim(),
      sectionNumber: "Section 8.2",
      riskType: "Legal",
      riskScore: isUncapped ? 85 : 45,
      reason: isUncapped
        ? "One-sided indemnity exposing customer to uncapped third-party claims."
        : "Standard mutual intellectual property infringement indemnity clauses.",
      marketStandardStatus: isUncapped ? "Unfavourable" : "Favourable",
      marketComparisonReason: isUncapped
        ? "Exceeds standard risk sharing policies."
        : "Matches standard mutual liability templates."
    });
  } else {
    clauses.push({
      clauseType: "Indemnity",
      clauseText: "Each party shall defend, indemnify, and hold harmless the other party from and against any and all claims, actions, suits, or demands arising out of material breaches of representations or warranties.",
      sectionNumber: "Article 8",
      riskType: "Legal",
      riskScore: 25,
      reason: "Standard mutual indemnity clause. Minimizes legal friction.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Standard mutual setup."
    });
  }

  // 2. Limitation of Liability
  const liabilityMatch = text.match(/(?:limit|limitation|liability|cap)[^.]{30,600}\./i);
  if (liabilityMatch) {
    const isUnlimited = lowercaseText.includes('unlimited') || !lowercaseText.includes('cap') || lowercaseText.includes('no event shall either');
    clauses.push({
      clauseType: "Limitation of Liability",
      clauseText: liabilityMatch[0].trim(),
      sectionNumber: "Section 9.1",
      riskType: "Financial",
      riskScore: isUnlimited ? 90 : 35,
      reason: isUnlimited
        ? "No financial cap on liability was detected, creating infinite financial exposure."
        : "Liability is capped at 12 months fees, which aligns with standard corporate contracts.",
      marketStandardStatus: isUnlimited ? "Unfavourable" : "Favourable",
      marketComparisonReason: isUnlimited
        ? "Deviates from standard contract value cap."
        : "Aligned with Net-Fees values."
    });
  } else {
    clauses.push({
      clauseType: "Limitation of Liability",
      clauseText: "In no event shall either party's aggregate liability exceed the total amounts paid by customer in the twelve (12) months preceding the incident.",
      sectionNumber: "Section 10.2",
      riskType: "Financial",
      riskScore: 30,
      reason: "Standard 12-month fee cap is in place. Limits exposure.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Standard fee-cap limitation."
    });
  }

  // 3. Governing Law
  const lawMatch = text.match(/(?:governing law|jurisdiction|arbitration|venue)[^.]{30,400}\./i);
  if (lawMatch) {
    const isForeign = lowercaseText.includes('london') || lowercaseText.includes('switzerland') || lowercaseText.includes('china') || lowercaseText.includes('foreign');
    clauses.push({
      clauseType: "Governing Law",
      clauseText: lawMatch[0].trim(),
      sectionNumber: "Section 14.5",
      riskType: "Legal",
      riskScore: isForeign ? 65 : 20,
      reason: isForeign
        ? "Governing law is set to a foreign jurisdiction, increasing potential dispute resolution costs."
        : "Standard domestic jurisdiction. Low legal risk.",
      marketStandardStatus: isForeign ? "Unusual" : "Favourable",
      marketComparisonReason: isForeign ? "Non-standard jurisdiction selected." : "Standard local governance."
    });
  } else {
    clauses.push({
      clauseType: "Governing Law",
      clauseText: "This Agreement shall be governed by and construed in accordance with the laws of the State of Delaware.",
      sectionNumber: "Section 12.1",
      riskType: "Legal",
      riskScore: 15,
      reason: "Governing law set to Delaware, standard for US corporate contracts.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Highly standard corporate state."
    });
  }

  // 4. Termination
  const termMatch = text.match(/(?:terminate|termination|notice|convenience)[^.]{30,500}\./i);
  if (termMatch) {
    const shortNotice = lowercaseText.includes('15 days') || lowercaseText.includes('immediate') || lowercaseText.includes('7 days');
    clauses.push({
      clauseType: "Termination",
      clauseText: termMatch[0].trim(),
      sectionNumber: "Section 4.2",
      riskType: "Operational",
      riskScore: shortNotice ? 75 : 30,
      reason: shortNotice
        ? "The notice period for termination is extremely short, risking operational interruption."
        : "Contains standard 30-day notice period for termination for convenience.",
      marketStandardStatus: shortNotice ? "Unfavourable" : "Favourable",
      marketComparisonReason: shortNotice ? "Shorter than standard 30-day notice." : "Matches 30-day baseline."
    });
  } else {
    clauses.push({
      clauseType: "Termination",
      clauseText: "Either party may terminate this agreement for convenience upon 30 days written notice to the other party.",
      sectionNumber: "Article 4.2",
      riskType: "Operational",
      riskScore: 25,
      reason: "Balanced 30-day notice for convenience termination.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Standard notice period."
    });
  }

  // 5. IP Ownership
  const ipMatch = text.match(/(?:intellectual property|ip ownership|copyright|patent)[^.]{30,500}\./i);
  if (ipMatch) {
    const isVendorOwned = lowercaseText.includes('vendor owns') || lowercaseText.includes('provider retains all rights') || lowercaseText.includes('no work product transfer');
    clauses.push({
      clauseType: "IP Ownership",
      clauseText: ipMatch[0].trim(),
      sectionNumber: "Section 7.1",
      riskType: "Legal",
      riskScore: isVendorOwned ? 70 : 20,
      reason: isVendorOwned
        ? "Vendor retains all intellectual property in custom work product created for Customer."
        : "Customer owns deliverables, which is favorable for client-funded projects.",
      marketStandardStatus: isVendorOwned ? "Unfavourable" : "Favourable",
      marketComparisonReason: isVendorOwned ? "Custom deliverables ownership should belong to client." : "Matches client ownership expectations."
    });
  } else {
    clauses.push({
      clauseType: "IP Ownership",
      clauseText: "Vendor assigns all rights, titles, and interests in the custom deliverables to the Customer upon full payment.",
      sectionNumber: "Section 6",
      riskType: "Legal",
      riskScore: 20,
      reason: "Standard intellectual property assignment following fee execution.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Standard client-side transfer."
    });
  }

  // 6. Payment Terms
  const payMatch = text.match(/(?:payment|invoice|net|fees|billing)[^.]{30,500}\./i);
  if (payMatch) {
    const isLongPay = lowercaseText.includes('net 60') || lowercaseText.includes('net 90') || lowercaseText.includes('90 days');
    clauses.push({
      clauseType: "Payment Terms",
      clauseText: payMatch[0].trim(),
      sectionNumber: "Section 3.3",
      riskType: "Financial",
      riskScore: isLongPay ? 60 : 30,
      reason: isLongPay
        ? "Payment period of 60-90 days strains vendor cash flows unnecessarily."
        : "Standard payment timeline (Net 30 days) is specified.",
      marketStandardStatus: isLongPay ? "Unfavourable" : "Favourable",
      marketComparisonReason: isLongPay ? "Longer than standard 30 days." : "Matches 30-day baseline."
    });
  } else {
    clauses.push({
      clauseType: "Payment Terms",
      clauseText: "Customer shall pay all undisputed invoices within thirty (30) days of receipt.",
      sectionNumber: "Section 3.1",
      riskType: "Financial",
      riskScore: 20,
      reason: "Standard Net 30 payment terms.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Matches standard 30-day terms."
    });
  }

  // 7. Confidentiality
  const confMatch = text.match(/(?:confidential|confidentiality|non-disclosure|disclosure)[^.]{30,500}\./i);
  if (confMatch) {
    const isOneSided = lowercaseText.includes('one-way') || lowercaseText.includes('unilateral') || lowercaseText.includes('disclose only');
    clauses.push({
      clauseType: "Confidentiality",
      clauseText: confMatch[0].trim(),
      sectionNumber: "Section 6.1",
      riskType: "Reputational",
      riskScore: isOneSided ? 65 : 20,
      reason: isOneSided
        ? "One-sided confidentiality only protects the vendor's data, leaving client exposed."
        : "Mutual confidentiality agreement is in place, protecting both parties equally.",
      marketStandardStatus: isOneSided ? "Unfavourable" : "Favourable",
      marketComparisonReason: isOneSided ? "Should be mutual rather than unilateral." : "Standard mutual NDA format."
    });
  } else {
    clauses.push({
      clauseType: "Confidentiality",
      clauseText: "Each party agrees to hold in confidence all proprietary information disclosed by the other party and use it only for executing this agreement.",
      sectionNumber: "Section 5",
      riskType: "Reputational",
      riskScore: 15,
      reason: "Standard mutual confidentiality protection.",
      marketStandardStatus: "Favourable",
      marketComparisonReason: "Standard mutual NDA clause."
    });
  }

  return clauses;
}

function generateMockSummary(text, clauses) {
  let totalScore = 0;
  clauses.forEach((c) => (totalScore += c.riskScore));
  const avgScore = clauses.length > 0 ? Math.round(totalScore / clauses.length) : 50;

  const parties = [];
  const matches = text.match(/between\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+and\s+|,)/);
  if (matches && matches[1]) {
    parties.push(matches[1].trim());
  } else {
    parties.push('Vendor Corporation');
  }

  const matchesSecond = text.match(/and\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+collectively|;|\.)/);
  if (matchesSecond && matchesSecond[1]) {
    parties.push(matchesSecond[1].trim());
  } else {
    parties.push('Customer Enterprises Inc.');
  }

  return {
    purpose: 'This agreement establishes terms for professional services, product licensing, and mutual business operations.',
    parties: parties,
    keyObligations: [
      'Provision of professional services and custom deliverables as described in Statement of Work.',
      'Timely payment of all undisputed fees within 30 days of invoice receipt.',
      'Strict compliance with standard intellectual property guidelines and mutual confidentiality.'
    ],
    topRisks: [
      'Potential high liability risk if uncapped liability or general indemnities exist.',
      'Operational threat from rapid unilateral termination options if active.'
    ],
    negotiationPoints: [
      'Ensure all liability is capped at a standard 12-month fees multiplier.',
      'Negotiate termination notice periods to be mutual and equal to at least 30 days.',
      'Confirm all custom intellectual property transfers fully upon invoice clearance.'
    ],
    overallRiskScore: avgScore
  };
}

module.exports = MockProvider;
