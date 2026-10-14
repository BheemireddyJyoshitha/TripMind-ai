import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import tripRoutes from './routes/tripRoutes.js';

// Setup dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend folder, falling back to parent folder if needed
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// API Routes
app.use('/api', tripRoutes);

// Fallback to index.html for root or SPA navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(` TripMind AI — Multi-Agent Travel Planner is running!`);
  console.log(` Port:             ${PORT} (bound to 0.0.0.0)`);
  console.log(` Web Application:  http://localhost:${PORT}`);
  console.log(` Health Endpoint:  http://localhost:${PORT}/api/health`);
  console.log(` Trip Endpoint:    POST http://localhost:${PORT}/api/trip`);
  
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_actual_api_key') {
    console.log(` AI Engine:        Google Gemini (${process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'}) [ACTIVE]`);
  } else {
    console.log(` AI Engine:        [WARNING] GEMINI_API_KEY not configured.`);
    console.log(`                   Add your key to environment variables to enable generation.`);
  }
  console.log('====================================================');
});
