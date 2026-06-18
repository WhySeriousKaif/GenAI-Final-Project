// =========================================================================
// Contract Chat Controller (RAG Engine Interface)
// =========================================================================
// This controller handles questions asked about a specific contract.
// It leverages our in-memory RAG (Retrieval-Augmented Generation) pipeline,
// querying the database for the contract text, extracting key context, 
// and formatting the final query for the Gemini model or local fallback.

const Contract = require('../models/Contract');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../errors/AppError');
const { queryContract } = require('../services/ragService');

/**
 * Handle questioning a contract.
 * POST /api/chat/:contractId
 * Body: { question: "..." }
 */
const chatWithContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { question } = req.body;

  if (!question || question.trim() === '') {
    throw new AppError('Question cannot be empty.', 400);
  }

  // Include `embeddings` (select:false) so the RAG service can reuse cached vectors.
  const contract = await Contract.findById(contractId).select('+embeddings');
  if (!contract) {
    throw new AppError('Contract not found.', 404);
  }

  console.log(`[Chat Controller] Question received: "${question}" for Contract: "${contract.title}"`);

  const chatResult = await queryContract(contract, question);

  return res.status(200).json({
    success: true,
    answer: chatResult.answer,
    contextUsed: chatResult.contextUsed,
    mode: chatResult.mode
  });
});

module.exports = {
  chatWithContract
};
