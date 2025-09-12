#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = path.join(__dirname, 'src');

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Mock API handlers
const apiHandlers = {
  '/api/users/exists': (req, res, parsedUrl) => {
    const email = parsedUrl.query.email || 'unknown@example.com';
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      exists: false,
      email: email,
      message: 'User does not exist'
    }));
  },
  
  '/api/auth/magic-link': (req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const data = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Magic link sent successfully',
          data: {
            email: data.email || 'unknown@example.com',
            expiresIn: 900,
            sentAt: new Date().toISOString()
          }
        }));
      });
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
  },
  
  '/api/linkedin/start': (req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization?mock=true',
      state: 'mock_state_' + Date.now()
    }));
  }
};

// Create server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Check if it's an API endpoint
  const apiPath = pathname.split('?')[0];
  if (apiHandlers[apiPath]) {
    apiHandlers[apiPath](req, res, parsedUrl);
    return;
  }
  
  // Serve static files
  let filePath = path.join(BASE_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Try as API mock file
      const apiFilePath = path.join(BASE_DIR, pathname);
      fs.readFile(apiFilePath, (err, data) => {
        if (err) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(data);
        }
      });
      return;
    }
    
    if (stats.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    
    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      
      const ext = path.extname(filePath);
      const contentType = mimeTypes[ext] || 'application/octet-stream';
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Development server running at http://localhost:${PORT}/`);
  console.log(`Serving files from: ${BASE_DIR}`);
  console.log('\nAPI endpoints available:');
  console.log('  - GET  /api/users/exists?email=test@example.com');
  console.log('  - POST /api/auth/magic-link');
  console.log('  - GET  /api/linkedin/start');
  console.log('  - Plus all static mock files in /api/');
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\nShutting down development server...');
  server.close(() => {
    process.exit(0);
  });
});