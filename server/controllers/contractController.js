// =========================================================================
// Contract Controller
// =========================================================================
// This controller acts as the traffic cop for all contract-related requests.
// It coordinates between text extraction, AI services, MongoDB models,
// and the Neo4j graph database.
// 
// Every function is designed to be highly readable, showing how full-stack
// operations (File Upload -> DB Insert -> Graph Sync -> Response) are sequenced.

const fs = require('fs');
const Contract = require('../models/Contract');
const { ingestContract } = require('../services/contractIngestionService');
const { deleteContractFromGraph, getContractGraphData } = require('../services/neo4jService');

/** Best-effort removal of the multer temp file. */
const cleanupTempFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

/**
 * 1. UPLOAD AND ANALYZE CONTRACT
 * Thin HTTP layer: validates the upload, delegates the pipeline to the ingestion
 * service, manages the temp-file lifecycle, and shapes the response.
 */
const uploadAndAnalyzeContract = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please upload a PDF or DOCX file.' });
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
  } catch (error) {
    // Extraction failures are client errors (422); everything else is a 500.
    if (error.statusCode === 422) {
      return res.status(422).json({ success: false, message: error.message });
    }

    console.error(`[Upload Controller Crash]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during document analysis.',
      error: error.message
    });
  } finally {
    cleanupTempFile(filePath);
  }
};

/**
 * 2. GET ALL CONTRACTS
 * Retrieves the contract registry list. Supports simple title filtering.
 */
const getAllContracts = async (req, res) => {
  try {
    const { search } = req.query;
    let filter = {};

    if (search) {
      filter = { title: { $regex: search, $options: 'i' } };
    }

    // Select only header info (excluding massive rawText fields) for speed
    const contracts = await Contract.find(filter)
      .select('title uploadedAt overallRiskScore extractedClauses.clauseType')
      .sort({ uploadedAt: -1 });

    return res.status(200).json({ success: true, count: contracts.length, contracts });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 3. GET CONTRACT DETAILS & GRAPH NODES
 * Returns the full contract data and constructs its graphical node representation.
 */
const getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    // Pull node-link structures for the frontend graph visualizer
    const graphData = await getContractGraphData(contract);

    return res.status(200).json({
      success: true,
      contract,
      graphData
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 4. DELETE CONTRACT
 * Removes the contract from MongoDB and cleans up its Neo4j graph nodes.
 */
const deleteContract = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findByIdAndDelete(id);

    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    // Delete related nodes in graph database
    await deleteContractFromGraph(id);

    return res.status(200).json({
      success: true,
      message: `Contract "${contract.title}" deleted successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 5. GLOBAL SEARCH (Feature 8)
 * Performs matching searches across all contracts, querying both filenames and clause texts.
 */
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search term is empty.' });
    }

    console.log(`[Search] Running global query for keyword: "${q}"`);

    // Matches titles or matches clauseText inside nested arrays
    const results = await Contract.find({
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { "extractedClauses.clauseText": { $regex: q, $options: 'i' } }
      ]
    }).select('title overallRiskScore uploadedAt extractedClauses');

    // Filter results to return the specific matching clauses and highlight matches
    const searchMatches = [];

    results.forEach(contract => {
      contract.extractedClauses.forEach(clause => {
        if (clause.clauseText.toLowerCase().includes(q.toLowerCase())) {
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

    return res.status(200).json({
      success: true,
      count: searchMatches.length,
      matches: searchMatches
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadAndAnalyzeContract,
  getAllContracts,
  getContractById,
  deleteContract,
  globalSearch
};
