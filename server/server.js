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
const { checkNeo4jStatus } = require('./services/neo4jService');
const Contract = require('./models/Contract');

// 1. Initialize Express App
const app = express();
const PORT = process.env.PORT || 5000;

// 2. Connect to MongoDB
connectDB();

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
  const isGeminiActive = !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim() !== '' && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here');
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
app.post('/api/admin/reset-db', protect, authorize('admin'), async (req, res) => {
  try {
    const result = await Contract.deleteMany({});
    console.warn('[Admin] Reset database requested. All contracts purged.');
    
    // Attempt Neo4j complete purge if active
    const { checkNeo4jStatus } = require('./services/neo4jService');
    const neo4jStatus = checkNeo4jStatus();
    if (neo4jStatus.isConnected) {
      const neo4j = require('neo4j-driver');
      const driver = neo4j.driver(process.env.NEO4J_URI, neo4j.auth.basic(process.env.NEO4J_USERNAME, process.env.NEO4J_PASSWORD));
      const session = driver.session();
      await session.run('MATCH (n) DETACH DELETE n');
      await session.close();
      await driver.close();
      console.warn('[Admin] Neo4j database graph purged.');
    }

    return res.status(200).json({
      success: true,
      message: `Database successfully reset. ${result.deletedCount} contracts deleted.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

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
