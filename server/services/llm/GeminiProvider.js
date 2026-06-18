// =========================================================================
// GeminiProvider — Online LLM implementation (Google Gemini)
// =========================================================================
// Wraps the @google/generative-ai SDK behind the LLMProvider interface.
// All Gemini-specific prompts and model calls live here and NOWHERE else.

const LLMProvider = require('./LLMProvider');
const { CHAT_MODEL, EMBEDDING_MODEL, MAX_ANALYSIS_CHARS, MAX_SUMMARY_CHARS } = require('../../config/aiConfig');

/**
 * Strips ```json ... ``` markdown fences so JSON.parse() succeeds on model output.
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

class GeminiProvider extends LLMProvider {
  constructor(client) {
    super();
    this.client = client;
  }

  get canEmbed() {
    return true;
  }

  async analyzeClauses(rawText) {
    const model = this.client.getGenerativeModel({
      model: CHAT_MODEL,
      generationConfig: { responseMimeType: 'application/json' }
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
        ${rawText.substring(0, MAX_ANALYSIS_CHARS)} // Truncated to fit within model constraints if huge
      `;

    const result = await model.generateContent(prompt);
    const cleaned = cleanJsonString(result.response.text());
    return JSON.parse(cleaned);
  }

  async summarize(rawText, clauses) {
    const model = this.client.getGenerativeModel({
      model: CHAT_MODEL,
      generationConfig: { responseMimeType: 'application/json' }
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
        ${rawText.substring(0, MAX_SUMMARY_CHARS)}
      `;

    const result = await model.generateContent(prompt);
    const cleaned = cleanJsonString(result.response.text());
    return JSON.parse(cleaned);
  }

  async embed(texts) {
    const model = this.client.getGenerativeModel({ model: EMBEDDING_MODEL });
    return Promise.all(
      texts.map(async (text) => {
        try {
          const res = await model.embedContent(text);
          return res.embedding.values;
        } catch (e) {
          console.error(`[GeminiProvider] Embedding failed for a chunk: ${e.message}`);
          return null;
        }
      })
    );
  }

  async answer(contextText, question) {
    const model = this.client.getGenerativeModel({ model: CHAT_MODEL });

    const prompt = `
        You are a highly helpful legal assistant for the Legal Document Intelligence System.
        Your goal is to answer questions about a legal contract using ONLY the provided verified context.
        If the answer cannot be found in the context, be honest and state that the contract does not mention it.
        Keep your answer clear, educational, and easy for a non-lawyer to understand.

        Verified Contract Context:
        ${contextText}

        User Question:
        ${question}

        Answer:
      `;

    const result = await model.generateContent(prompt);
    return { answer: result.response.text(), mode: 'AI (Gemini)' };
  }
}

module.exports = GeminiProvider;
