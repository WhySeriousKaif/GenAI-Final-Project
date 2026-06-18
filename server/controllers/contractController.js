// =========================================================================
// Contract Controller (thin HTTP layer)
// =========================================================================
// Controllers validate input, delegate to services, and shape responses. They
// THROW AppError for expected failures; the central errorHandler formats them.
// No per-handler try/catch — asyncHandler forwards rejections to the pipeline.

const fs = require('fs');
const Contract = require('../models/Contract');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../errors/AppError');
const { ingestContract } = require('../services/contractIngestionService');
const { deleteContractFromGraph, getContractGraphData } = require('../services/neo4jService');
const { serializeContractDetail, serializeContractList } = require('../dto/contractDTO');

/** Best-effort removal of the multer temp file. */
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * 1. UPLOAD AND ANALYZE CONTRACT
 * Validates the upload, delegates the pipeline to the ingestion service, and
 * always cleans up the temp file. ExtractionError (422) and other failures
 * propagate to the central error handler.
 */
const uploadAndAnalyzeContract = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('Please upload a PDF or DOCX file.', 400);
  }

  const { path: filePath, originalname: originalName, size } = req.file;
  console.log(`[Controller] Ingesting file: ${originalName} (Size: ${size} bytes)`);

  try {
    const savedContract = await ingestContract(filePath, originalName);

    return res.status(201).json({
      success: true,
      message: 'Contract uploaded and analyzed successfully!',
      contractId: savedContract._id,
      overallRiskScore: savedContract.overallRiskScore
    });
  } finally {
    cleanupTempFile(filePath);
  }
});

/**
 * 2. GET ALL CONTRACTS — registry list with optional title filter.
 */
const getAllContracts = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = search ? { title: { $regex: search, $options: 'i' } } : {};

  const contracts = await Contract.find(filter)
    .select('title uploadedAt overallRiskScore extractedClauses.clauseType')
    .sort({ uploadedAt: -1 });

  return res.status(200).json({
    success: true,
    count: contracts.length,
    contracts: serializeContractList(contracts)
  });
});

/**
 * 3. GET CONTRACT DETAILS & GRAPH NODES
 */
const getContractById = asyncHandler(async (req, res) => {
  const contract = await Contract.findById(req.params.id);
  if (!contract) {
    throw new AppError('Contract not found.', 404);
  }

  const graphData = getContractGraphData(contract);
  return res.status(200).json({
    success: true,
    contract: serializeContractDetail(contract),
    graphData
  });
});

/**
 * 4. DELETE CONTRACT — removes from MongoDB and the graph database.
 */
const deleteContract = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const contract = await Contract.findByIdAndDelete(id);
  if (!contract) {
    throw new AppError('Contract not found.', 404);
  }

  await deleteContractFromGraph(id);
  return res.status(200).json({
    success: true,
    message: `Contract "${contract.title}" deleted successfully.`
  });
});

/**
 * 5. GLOBAL SEARCH — scans titles and clause texts for a keyword.
 */
const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    throw new AppError('Search term is empty.', 400);
  }

  console.log(`[Search] Running global query for keyword: "${q}"`);

  const results = await Contract.find({
    $or: [
      { title: { $regex: q, $options: 'i' } },
      { 'extractedClauses.clauseText': { $regex: q, $options: 'i' } }
    ]
  }).select('title overallRiskScore uploadedAt extractedClauses');

  const needle = q.toLowerCase();
  const searchMatches = [];
  results.forEach((contract) => {
    contract.extractedClauses.forEach((clause) => {
      if (clause.clauseText.toLowerCase().includes(needle)) {
        searchMatches.push({
          contractId: contract._id,
          contractTitle: contract.title,
          overallRiskScore: contract.overallRiskScore,
          clauseType: clause.clauseType,
          clauseText: clause.clauseText,
          sectionNumber: clause.sectionNumber,
          riskScore: clause.riskScore,
          riskType: clause.riskType
        });
      }
    });
  });

  return res.status(200).json({ success: true, count: searchMatches.length, matches: searchMatches });
});

module.exports = {
  uploadAndAnalyzeContract,
  getAllContracts,
  getContractById,
  deleteContract,
  globalSearch
};
