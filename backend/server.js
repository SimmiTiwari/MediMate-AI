/**
 * MediMate AI - Express / Native Node.js Hybrid Server
 * Automatically uses Express when dependencies are installed, or seamlessly falls back
 * to Node.js native http/mime engine if running in zero-dependency mode.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

// Read .env if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  });
}

const { generateChatResponse, generateWellnessSummary, MEDICAL_DISCLAIMER } = require('./gemini');

const PORT = parseInt(process.env.PORT || '5001', 10);
const frontendPath = path.join(__dirname, '..', 'frontend');

// MIME types dictionary for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Check if Express & dependencies are available
let useExpress = false;
try {
  require.resolve('express');
  require.resolve('cors');
  require.resolve('express-rate-limit');
  useExpress = true;
} catch (e) {
  useExpress = false;
}

if (useExpress) {
  startExpressServer();
} else {
  startNativeServer();
}

/**
 * Mode A: Express Server Implementation
 */
function startExpressServer() {
  const express = require('express');
  const cors = require('cors');
  const rateLimit = require('express-rate-limit');

  const app = express();

  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5001',
    'http://127.0.0.1:5001',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev-friendly permissive local CORS
    },
    credentials: true
  }));

  app.use(express.json({ limit: '250kb' }));
  app.use(express.urlencoded({ extended: true, limit: '250kb' }));

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    message: { success: false, error: 'Too many requests. Please try again after 15 minutes.' }
  });
  app.use('/api/', apiLimiter);

  app.use(express.static(frontendPath));

  app.get('/api/health', (req, res) => {
    res.json(getHealthPayload('Express (Full Stack)'));
  });

  app.post('/api/chat', async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ success: false, error: 'Invalid request: "message" is required.' });
      }
      if (message.length > 2000) {
        return res.status(400).json({ success: false, error: 'Message exceeds 2,000 character limit.' });
      }
      const result = await generateChatResponse(message.trim(), history || []);
      res.json({ success: true, response: result.text, isFallback: result.isFallback, disclaimer: result.disclaimer });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
  });

  app.post('/api/summary', async (req, res) => {
    try {
      const { period, healthLogs, journalEntries } = req.body;
      const result = await generateWellnessSummary(period === 'weekly' ? 'weekly' : 'daily', healthLogs || [], journalEntries || []);
      res.json({ success: true, summaryText: result.summaryText, isFallback: result.isFallback, disclaimer: result.disclaimer });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message || 'Internal Server Error' });
    }
  });

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });

  app.listen(PORT, () => {
    printBanner('Express');
  });
}

/**
 * Mode B: Native Node.js Server Implementation (Zero dependencies required)
 */
function startNativeServer() {
  const server = http.createServer(async (req, res) => {
    // Enable CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // API Routes
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(getHealthPayload('Native Node.js')));
      return;
    }

    if (pathname === '/api/chat' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { message, history } = body;
        if (!message || typeof message !== 'string' || message.trim().length === 0) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid request: "message" is required.' }));
          return;
        }
        const result = await generateChatResponse(message.trim(), history || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          response: result.text,
          isFallback: result.isFallback,
          disclaimer: result.disclaimer
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
      }
      return;
    }

    if (pathname === '/api/summary' && req.method === 'POST') {
      try {
        const body = await parseJsonBody(req);
        const { period, healthLogs, journalEntries } = body;
        const result = await generateWellnessSummary(period === 'weekly' ? 'weekly' : 'daily', healthLogs || [], journalEntries || []);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          summaryText: result.summaryText,
          isFallback: result.isFallback,
          disclaimer: result.disclaimer
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message || 'Server error' }));
      }
      return;
    }

    // Static file serving from frontend directory
    let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '') {
      safePath = '/index.html';
    }

    let filePath = path.join(frontendPath, safePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(frontendPath, 'index.html');
    }

    if (fs.existsSync(filePath) && !fs.statSync(filePath).isDirectory()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  });

  server.listen(PORT, () => {
    printBanner('Native Node.js (Zero-Dependency Engine)');
  });
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 250000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (e) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

function getHealthPayload(engine) {
  const hasGeminiKey = Boolean(
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY.trim() !== '' &&
    process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here'
  );

  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'MediMate AI Backend',
    version: '1.0.0',
    engine,
    geminiConfigured: hasGeminiKey,
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    uptimeSeconds: Math.floor(process.uptime()),
    zeroCostCertified: true,
    medicalDisclaimer: MEDICAL_DISCLAIMER
  };
}

function printBanner(engine) {
  console.log(`=================================================`);
  console.log(`  MediMate AI Server Running (${engine})`);
  console.log(`  Local URL:    http://localhost:${PORT}`);
  console.log(`  Health Check: http://localhost:${PORT}/api/health`);
  console.log(`  Disclaimer:   Educational wellness only`);
  console.log(`=================================================`);
}
