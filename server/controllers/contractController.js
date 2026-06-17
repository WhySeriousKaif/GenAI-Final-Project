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
const { extractTextFromFile } = require('../services/textExtractor');
const { analyzeContractText, generateExecutiveSummary } = require('../services/aiService');
const { syncContractToGraph, deleteContractFromGraph, getContractGraphData } = require('../services/neo4jService');

/**
 * 1. UPLOAD AND ANALYZE CONTRACT
 * Handles: File upload -> Text Extraction -> Gemini Clause Analysis -> Executive Summary -> MongoDB Save -> Neo4j Sync
 */
const uploadAndAnalyzeContract = async (req, res) => {
  try {
    // Multer stores the uploaded file details in req.file
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or DOCX file.' });
    }

    const filePath = req.file.path;
    const originalName = req.file.originalname;
    console.log(`[Controller] Ingesting file: ${originalName} (Size: ${req.file.size} bytes)`);

    // Step A: Extract plain text from the uploaded document (PDF/DOCX)
    let extractedText = '';
    try {
      extractedText = await extractTextFromFile(filePath, originalName);
    } catch (extractionError) {
      // Clean up file from server if extraction fails
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(422).json({ success: false, message: extractionError.message });
    }

    // Step B: Call Gemini AI to extract clauses, evaluate risks, and compare standards
    console.log('[Controller] Triggering AI clause extraction...');
    let extractedClauses = [];
    try {
      extractedClauses = await analyzeContractText(extractedText);
    } catch (aiError) {
      console.error(`[AI Error]: ${aiError.message}`);
      // Continue with empty clauses or handle error
    }

    // Step C: Generate a one-page Executive Summary
    console.log('[Controller] Triggering AI executive summary generation...');
    let summary = null;
    try {
      summary = await generateExecutiveSummary(extractedText, extractedClauses);
    } catch (summaryError) {
      console.error(`[Summary AI Error]: ${summaryError.message}`);
    }

    // Step D: Calculate the overall risk score as the average of extracted clause risk scores
    let overallRiskScore = 0;
    if (extractedClauses.length > 0) {
      const sum = extractedClauses.reduce((acc, c) => acc + Number(c.riskScore), 0);
      overallRiskScore = Math.round(sum / extractedClauses.length);
    }
    
    if (summary && !summary.overallRiskScore) {
      summary.overallRiskScore = overallRiskScore;
    } else if (summary) {
      // Sync values
      overallRiskScore = summary.overallRiskScore;
    }

    // Step E: Save the new Contract record in MongoDB
    console.log('[Controller] Saving contract record in MongoDB...');
    const newContract = new Contract({
      title: originalName,
      rawText: extractedText,
      extractedClauses: extractedClauses,
      summary: summary,
      overallRiskScore: overallRiskScore
    });

    const savedContract = await newContract.save();

    // Step F: Sync the nodes and links to the Neo4j Graph Database
    console.log('[Controller] Syncing nodes to Neo4j...');
    await syncContractToGraph(savedContract);

    // Step G: Clean up the uploaded file from server disk (since the text is now safely in MongoDB)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Return the response containing the saved document ID for navigation
    return res.status(201).json({
      success: true,
      message: 'Contract uploaded and analyzed successfully!',
      contractId: savedContract._id,
      overallRiskScore: savedContract.overallRiskScore
    });

  } catch (error) {
    console.error(`[Upload Controller Crash]: ${error.message}`);
    
    // Safety file clean up
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred during document analysis.',
      error: error.message
    });
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
