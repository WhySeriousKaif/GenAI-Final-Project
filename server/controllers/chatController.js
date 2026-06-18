// =========================================================================
// Contract Chat Controller (RAG Engine Interface)
// =========================================================================
// This controller handles questions asked about a specific contract.
// It leverages our in-memory RAG (Retrieval-Augmented Generation) pipeline,
// querying the database for the contract text, extracting key context, 
// and formatting the final query for the Gemini model or local fallback.

const Contract = require('../models/Contract');
const { queryContract } = require('../services/ragService');

/**
 * Handle questioning a contract.
 * POST /api/chat/:contractId
 * Body: { question: "..." }
 */
const chatWithContract = async (req, res) => {
  try {
    const { contractId } = req.params;
    const { question } = req.body;

    if (!question || question.trim() === '') {
      return res.status(400).json({ success: false, message: 'Question cannot be empty.' });
    }

    // 1. Retrieve the contract from MongoDB to get its rawText and metadata.
    // Explicitly include `embeddings` (marked select:false) so the RAG service
    // can reuse the cached chunk vectors instead of re-embedding the document.
    const contract = await Contract.findById(contractId).select('+embeddings');
    if (!contract) {
      return res.status(404).json({ success: false, message: 'Contract not found.' });
    }

    console.log(`[Chat Controller] Question received: "${question}" for Contract: "${contract.title}"`);

    // 2. Query the RAG service
    const chatResult = await queryContract(contract, question);

    // 3. Return the response containing the generated answer, context chunks, and processing mode
    return res.status(200).json({
      success: true,
      answer: chatResult.answer,
      contextUsed: chatResult.contextUsed,
      mode: chatResult.mode
    });

  } catch (error) {
    console.error(`[Chat Controller Crash]: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while answering your question.',
      error: error.message
    });
  }
};

module.exports = {
  chatWithContract
};
