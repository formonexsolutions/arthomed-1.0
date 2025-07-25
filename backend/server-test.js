const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/database');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Arthomed Backend is running',
    timestamp: new Date().toISOString(),
  });
});

// Simple test routes
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Arthomed Backend running on port ${PORT}`);
});

module.exports = app;
