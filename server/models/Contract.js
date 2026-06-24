// =========================================================================
// Mongoose Schema for Contracts and Extracted Clauses
// =========================================================================
// This file defines the shape and validation rules of the data stored in MongoDB.
// We are using a nested schema design (embedded documents) since each Clause 
// and Executive Summary belongs directly to one Contract. Embedded structures 
// provide faster read performance and ensure the data stays organized together.

const mongoose = require('mongoose');

// 1. CLAUSE SCHEMA (Subdocument)
// This schema represents a single extracted legal clause from a contract.
const ClauseSchema = new mongoose.Schema({
  // The type of clause (e.g., 'Indemnity', 'Limitation of Liability', 'Termination')
  clauseType: {
    type: String,
    required: true,
    trim: true
  },
  // The exact verbatim text or parsed paragraph of the clause
  clauseText: {
    type: String,
    required: true
  },
  // The section number in the contract (e.g., 'Section 14.2', 'Article IX')
  sectionNumber: {
    type: String,
    default: 'N/A'
  },
  // Risk categorization: financial risk, operational risk, legal risk, or reputational risk
  riskType: {
    type: String,
    enum: ['Financial', 'Operational', 'Legal', 'Reputational'],
    required: true
  },
  // Numeric risk score ranging from 0 (Safe) to 100 (Extremely Risky)
  riskScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Educational justification of why the clause is risky and what it means
  reason: {
    type: String,
    required: true
  },
  // Comparison rating against typical market baselines
  marketStandardStatus: {
    type: String,
    enum: ['Favourable', 'Unfavourable', 'Unusual'],
    required: true
  },
  // Details explaining the deviation from market standards (e.g., 'Notice period is longer than 30 days')
  marketComparisonReason: {
    type: String,
    default: ''
  }
});

// 2. EXECUTIVE SUMMARY SCHEMA (Subdocument)
// A high-level overview of the entire contract, translated to plain English.
const ExecutiveSummarySchema = new mongoose.Schema({
  // What the agreement is for (e.g., 'Software as a Service Subscription')
  purpose: {
    type: String,
    required: true
  },
  // List of organizations, entities or people signing the document
  parties: [{
    type: String
  }],
  // Essential deadlines, deliverables or actions required from parties
  keyObligations: [{
    type: String
  }],
  // Critical warnings about the agreement
  topRisks: [{
    type: String
  }],
  // Top 3 points that the user should attempt to renegotiate
  negotiationPoints: [{
    type: String
  }],
  // Calculated average risk score across the entire document
  overallRiskScore: {
    type: Number,
    default: 0
  }
});

// 2b. EMBEDDING CACHE SCHEMA (Subdocument)
// Stores precomputed online (OpenAI) embeddings for the contract's text chunks so
// the RAG chat does not have to re-embed the entire document on every question.
// Only the ONLINE embedding path is cached; offline TF-IDF stays compute-on-demand.
const EmbeddingChunkSchema = new mongoose.Schema({
  index: { type: Number, required: true },   // chunk order in the document
  text: { type: String, required: true },    // the chunk text (returned as RAG context)
  vector: { type: [Number], required: true } // the embedding vector
}, { _id: false });

const EmbeddingSchema = new mongoose.Schema({
  model: { type: String },          // e.g. 'text-embedding-004' — guards against mixing vector spaces
  dimension: { type: Number },      // vector length, for sanity checks
  chunkSize: { type: Number },      // chunking params captured so retrieval matches generation
  chunkOverlap: { type: Number },
  generatedAt: { type: Date },
  chunks: { type: [EmbeddingChunkSchema], default: [] }
}, { _id: false });

// 3. CONTRACT SCHEMA (Main Document)
// The root database record representing a full contract.
const ContractSchema = new mongoose.Schema({
  // The filename or name given by the user
  title: {
    type: String,
    required: true,
    trim: true
  },
  // When the contract was uploaded to our platform
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  // The full extracted raw text from the parsed PDF or DOCX file
  rawText: {
    type: String,
    required: true
  },
  // Embedded array of extracted legal clauses (defined above)
  extractedClauses: [ClauseSchema],
  // One-page executive summary block (defined above)
  summary: {
    type: ExecutiveSummarySchema
  },
  // Average risk score computed from the clauses for quick sorting/filtering
  overallRiskScore: {
    type: Number,
    default: 0
  },
  // Cached online embeddings for RAG chat. Marked `select: false` so the large
  // vector arrays are NEVER returned to list/detail endpoints or the frontend;
  // the RAG service explicitly opts in with `.select('+embeddings')`.
  embeddings: {
    type: EmbeddingSchema,
    select: false,
    default: undefined
  }
});

// We register and export the model using mongoose.model.
// Mongoose automatically plurals and maps 'Contract' to the 'contracts' collection.
module.exports = mongoose.model('Contract', ContractSchema);
