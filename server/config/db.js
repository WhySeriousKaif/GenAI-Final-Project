// =========================================================================
// MongoDB Connection Helper Using Mongoose
// =========================================================================
// This file initializes and manages our connection to the MongoDB database.
// MongoDB is a Document-oriented NoSQL database that stores data in JSON-like structures.
// Mongoose is an ODM (Object Data Modeling) library that provides a schema-based solution 
// to model our application data, handle validation, and query the DB.

const mongoose = require('mongoose');

// This function connects the Express server to the MongoDB instance.
// It uses the MONGODB_URI environment variable defined in the .env file.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/legal_doc_intel');
    
    console.log(`[Database] MongoDB Connected Successfully to Host: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Database Error] Failed to connect to MongoDB: ${error.message}`);
    // Exiting the process with code 1 indicates a crash or critical error,
    // which helps in deployments (like Render or Docker) to restart the container.
    process.exit(1);
  }
};

module.exports = connectDB;
