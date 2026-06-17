// =========================================================================
// Gemini AI Service & Analysis Engine
// =========================================================================
// This service controls all artificial intelligence operations.
// We use the Google Gemini API to analyze document texts, extract clauses,
// assess risk types/scores, compare against market benchmarks, and summarize.
//
// SAFETY FIRST: If no GEMINI_API_KEY is found in the environment, this service 
// gracefully falls back to a regex-based mock analyser. This guarantees that 
// students can run successful offline demonstrations without crashing.

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Initialize Gemini SDK if API Key is available
const apiKey = process.env.GEMINI_API_KEY;
let genAI = null;

if (apiKey && apiKey.trim() !== '' && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
  console.log('[AI Service] Gemini API initialized successfully.');
} else {
  console.warn('[AI Service Warning] GEMINI_API_KEY is missing or placeholder. Running in MOCK Mode.');
}

/**
 * Clean response text by removing potential markdown wrapping blocks: ```json ... ```
 * This helps prevent JSON.parse() errors when models return markdown blocks.
 */
const cleanJsonString = (rawText) => {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

/**
 * Extracts clauses and performs risk classification + market standard analysis.
 * Uses Gemini API, or falls back to regex-based mock parsing.
 */
const analyzeContractText = async (rawText) => {
  // If API key is available, run the actual Gemini analysis
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `
        You are an elite legal AI contracts analyst. Read the following contract text.
        Extract all major legal clauses belonging to these categories:
        - Indemnity
        - Limitation of Liability
        - Governing Law
        - Termination
        - IP Ownership
        - Payment Terms
        - Confidentiality

        For each extracted clause, perform the following:
        1. Identify the exact clauseType (from the list above).
        2. Extract the actual text (clauseText) and its sectionNumber (e.g. 'Section 4.1', 'N/A' if not numbered).
        3. Classify its primary riskType: 'Financial', 'Operational', 'Legal', or 'Reputational'.
        4. Calculate a riskScore (0 to 100):
           - 0-30: Low risk (standard, friendly terms)
           - 31-70: Medium risk (moderate exposure, needs verification)
           - 71-100: High risk (unfair indemnities, uncapped liability, immediate termination)
        5. Explain the risk score in a simple sentence (reason).
        6. Compare it against the typical market standards:
           - Termination Notice: 30 days standard.
           - Payment Period: 30 days standard (Net 30).
           - Liability Cap: Contract value limit standard.
           - Governing Law: Local/neutral jurisdiction.
           - IP Ownership: Customer owns custom works; vendor owns pre-existing tools.
           - Indemnity: Mutual IP infringement protection.
           - Confidentiality: Mutual obligations, 3-5 years.
        7. Classify the marketStandardStatus as:
           - 'Favourable': Favourable or beneficial to a standard customer.
           - 'Unfavourable': Highly unfavorable, unfair, or restrictive.
           - 'Unusual': Weird, atypical, or extremely outdated terms.
        8. Describe how it compares in 'marketComparisonReason'.

        Return the result strictly as a JSON array of objects. Do not wrap in markdown tags.
        JSON format:
        [
          {
            "clauseType": "Limitation of Liability",
            "clauseText": "The text of the clause...",
            "sectionNumber": "Section 9.1",
            "riskType": "Financial",
            "riskScore": 75,
            "reason": "Liability is completely unlimited, exposing the customer to infinite financial risk.",
            "marketStandardStatus": "Unfavourable",
            "marketComparisonReason": "Deviates from standard contract value cap."
          }
        ]

        Contract Text:
        ${rawText.substring(0, 40000)} // Truncated to fit within model constraints if huge
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = cleanJsonString(responseText);
      const clauses = JSON.parse(cleanedText);
      return clauses;
    } catch (error) {
      console.error(`[AI Service Error - Clause Extraction]: ${error.message}`);
      // Fallback to mock on error so the system is bulletproof
    }
  }

  // Fallback / Mock Analysis (Regex heuristic scanner)
  console.log('[AI Service] Executing Regex Fallback Analyser');
  return generateMockClauses(rawText);
};

/**
 * Generates an executive summary based on the text and analysed clauses.
 * Uses Gemini API, or falls back to standard heuristics.
 */
const generateExecutiveSummary = async (rawText, clauses) => {
  if (genAI) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
        You are a senior corporate lawyer. Write a plain-English, one-page Executive Summary of the contract.
        
        Using the contract text and extracted clauses, construct a JSON object containing:
        1. purpose: 1-2 sentence description of the contract purpose.
        2. parties: Array of strings naming the active parties signing the contract.
        3. keyObligations: Array of 3-4 key deliverables or payment obligations.
        4. topRisks: Array of 3-4 primary risks identified in the contract.
        5. negotiationPoints: Array of 3 critical recommendations to renegotiate before signing.
        6. overallRiskScore: Number (0-100) representing the average risk rating.

        JSON Format:
        {
          "purpose": "Description...",
          "parties": ["Company A", "Company B"],
          "keyObligations": ["...", "..."],
          "topRisks": ["...", "..."],
          "negotiationPoints": ["...", "..."],
          "overallRiskScore": 45
        }

        Contract Clauses Analysed:
        ${JSON.stringify(clauses)}

        Contract text snippet:
        ${rawText.substring(0, 15000)}
      `;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const cleanedText = cleanJsonString(responseText);
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error(`[AI Service Error - Executive Summary]: ${error.message}`);
    }
  }

  // Fallback / Mock Executive Summary
  return generateMockSummary(rawText, clauses);
};

// =========================================================================
// MOCK DATA GENERATION ALGORITHMS (Regex Heuristics)
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
    // Default placeholder clause if not found to ensure data exists
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
  // Aggregate overall risk score
  let totalScore = 0;
  clauses.forEach(c => totalScore += c.riskScore);
  const avgScore = clauses.length > 0 ? Math.round(totalScore / clauses.length) : 50;

  // Simple string scanning for parties
  const parties = [];
  const matches = text.match(/between\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+and\s+|,)/);
  if (matches && matches[1]) {
    parties.push(matches[1].trim());
  } else {
    parties.push("Vendor Corporation");
  }
  
  const matchesSecond = text.match(/and\s+([A-Z][a-zA-Z0-9\s,\.]+?)(?:\s+collectively|;|\.)/);
  if (matchesSecond && matchesSecond[1]) {
    parties.push(matchesSecond[1].trim());
  } else {
    parties.push("Customer Enterprises Inc.");
  }

  return {
    purpose: "This agreement establishes terms for professional services, product licensing, and mutual business operations.",
    parties: parties,
    keyObligations: [
      "Provision of professional services and custom deliverables as described in Statement of Work.",
      "Timely payment of all undisputed fees within 30 days of invoice receipt.",
      "Strict compliance with standard intellectual property guidelines and mutual confidentiality."
    ],
    topRisks: [
      "Potential high liability risk if uncapped liability or general indemnities exist.",
      "Operational threat from rapid unilateral termination options if active."
    ],
    negotiationPoints: [
      "Ensure all liability is capped at a standard 12-month fees multiplier.",
      "Negotiate termination notice periods to be mutual and equal to at least 30 days.",
      "Confirm all custom intellectual property transfers fully upon invoice clearance."
    ],
    overallRiskScore: avgScore
  };
}

module.exports = {
  analyzeContractText,
  generateExecutiveSummary
};
