// =========================================================================
// Contract Ingestion Service (orchestration, Single Responsibility)
// =========================================================================
// Owns the end-to-end "ingest a contract" pipeline that previously lived inside
// the controller: text extraction -> clause analysis -> executive summary ->
// risk scoring -> embedding cache -> persistence -> graph sync.
//
// The controller no longer knows HOW a contract is processed; it only translates
// HTTP <-> this service. File-transport concerns (multer temp file lifecycle)
// stay in the controller.

const Contract = require('../models/Contract');
const { extractTextFromFile } = require('./textExtractor');
const { analyzeContractText, generateExecutiveSummary } = require('./aiService');
const { generateEmbeddings, fitsDocLimit } = require('./ragService');
const { syncContractToGraph } = require('./neo4jService');
const { computeOverallRiskScore } = require('./riskScoring');

/**
 * Extraction failures are recoverable client errors (bad/empty/scanned file).
 * Tagged with statusCode so the HTTP layer can map them to 422 without coupling
 * this service to Express.
 */
class ExtractionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ExtractionError';
    this.statusCode = 422;
  }
}

/**
 * Runs the full ingestion pipeline for one uploaded document.
 * @param {string} filePath - path to the temp file on disk
 * @param {string} originalName - original filename (becomes the contract title)
 * @returns {Promise<object>} the saved Contract document
 */
const ingestContract = async (filePath, originalName) => {
  // Step A: Extract text (client-recoverable on failure).
  let rawText;
  try {
    rawText = await extractTextFromFile(filePath, originalName);
  } catch (extractionError) {
    throw new ExtractionError(extractionError.message);
  }

  // Step B: Clause analysis (best-effort; never fails the whole upload).
  let extractedClauses = [];
  try {
    extractedClauses = await analyzeContractText(rawText);
  } catch (aiError) {
    console.error(`[Ingestion] Clause extraction error: ${aiError.message}`);
  }

  // Step C: Executive summary (best-effort).
  let summary = null;
  try {
    summary = await generateExecutiveSummary(rawText, extractedClauses);
  } catch (summaryError) {
    console.error(`[Ingestion] Summary error: ${summaryError.message}`);
  }

  // Step D: Reconcile overall risk score with the summary's own value.
  let overallRiskScore = computeOverallRiskScore(extractedClauses);
  if (summary && !summary.overallRiskScore) {
    summary.overallRiskScore = overallRiskScore;
  } else if (summary) {
    overallRiskScore = summary.overallRiskScore;
  }

  // Step E: Build the contract record.
  const contract = new Contract({
    title: originalName,
    rawText,
    extractedClauses,
    summary,
    overallRiskScore
  });

  // Step E.5: Precompute + cache online embeddings (best-effort, size-guarded).
  await attachEmbeddingCache(contract, rawText);

  // Step F: Persist.
  const savedContract = await contract.save();

  // Step G: Sync to the graph database (no-op if Neo4j is offline).
  await syncContractToGraph(savedContract);

  return savedContract;
};

/**
 * Generates and attaches the embedding cache to a contract, guarded by the
 * document-size limit. Never throws — chat will lazily compute if skipped.
 */
const attachEmbeddingCache = async (contract, rawText) => {
  try {
    const embeddings = await generateEmbeddings(rawText);
    if (!embeddings) return;

    if (fitsDocLimit(rawText, embeddings)) {
      contract.embeddings = embeddings;
      console.log(`[Ingestion] Cached ${embeddings.chunks.length} chunk embeddings for RAG.`);
    } else {
      console.warn('[Ingestion] Embeddings exceed safe document size; skipping cache (chat will compute on demand).');
    }
  } catch (embedError) {
    console.error(`[Ingestion] Embedding cache error: ${embedError.message}`);
  }
};

module.exports = { ingestContract, ExtractionError };
