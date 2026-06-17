// =========================================================================
// Chat API Routes (RAG interface)
// =========================================================================
// This file registers Express routes for submitting interactive natural-language
// questions against contract text contexts.

const express = require('express');
const { chatWithContract } = require('../controllers/chatController');

const router = express.Router();

// 1. Submit Chat Question for a Contract
// POST /api/chat/:contractId
// Request Body: { question: "Who owns the IP deliverables?" }
router.post('/:contractId', chatWithContract);

module.exports = router;
