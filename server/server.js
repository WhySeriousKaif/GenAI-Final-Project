// =========================================================================
// Main Node.js & Express Server Entrypoint
// =========================================================================
// This is the bootstrap file for our backend. It loads environmental configurations,
// opens database channels, establishes Express middleware pipelines, mounts 
// REST routers, and spawns the listening port.

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const connectDB = require('./config/db');
const contractRoutes = require('./routes/contractRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const { protect, authorize } = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const { checkNeo4jStatus, initNeo4j, purgeAll } = require('./services/neo4jService');
const { isGeminiEnabled } = require('./config/aiConfig');
const asyncHandler = require('./middleware/asyncHandler');
const Contract = require('./models/Contract');

// 1. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect to MongoDB and initialize the Neo4j graph connection
connectDB();
initNeo4j();

// 3. Setup Global Middleware
app.use(cors()); // CORS allows frontend applications hosted on separate ports (like Vite on 5173) to communicate with this API
app.use(express.json()); // Parses incoming HTTP JSON payloads
app.use(express.urlencoded({ extended: true })); // Parses URL-encoded data

// 4. Create uploads directory if it does not exist (critical staging area for Multer)
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 5. Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/contracts', protect, contractRoutes);
app.use('/api/chat', protect, chatRoutes);

// 6. Admin API (Special Utility Endpoints for Viva Demonstrations)
app.get('/api/admin/status', protect, (req, res) => {
  const isGeminiActive = isGeminiEnabled;
  const neo4jStatus = checkNeo4jStatus();

  return res.status(200).json({
    success: true,
    services: {
      mongodb: mongooseConnectionState(),
      gemini: isGeminiActive ? 'Connected (Online AI Engine)' : 'Missing Key (Fallback Heuristics)',
      neo4j: neo4jStatus.isConnected ? `Connected (${neo4jStatus.uri})` : 'Offline (Local Relationship Fallback)'
    }
  });
});

// Delete all contracts from Database (Demo Reset Tool)
app.post('/api/admin/reset-db', protect, authorize('admin'), asyncHandler(async (req, res) => {
  const result = await Contract.deleteMany({});
  console.warn('[Admin] Reset database requested. All contracts purged.');

  // Encapsulated graph purge (no-op if Neo4j is offline).
  await purgeAll();

  return res.status(200).json({
    success: true,
    message: `Database successfully reset. ${result.deletedCount} contracts deleted.`
  });
}));

// Helper to determine Mongoose connection string status
const mongoose = require('mongoose');
function mongooseConnectionState() {
  const state = mongoose.connection.readyState;
  switch (state) {
    case 0: return 'Disconnected';
    case 1: return 'Connected';
    case 2: return 'Connecting';
    case 3: return 'Disconnecting';
    default: return 'Unknown';
  }
}

// 7. Base Root API Endpoint (Confirms server status)
app.get('/', (req, res) => {
  res.send('<h3>Legal Document Intelligence System API is Running.</h3>');
});

// 8. Mount Error Handling Middleware (must be registered last!)
app.use(errorHandler);

// 9. Startup Server Listener
app.listen(PORT, () => {
  console.log(`[Server] Express server running on port: ${PORT}`);
  console.log(`[Server] API Base Endpoint: http://localhost:${PORT}`);
});
