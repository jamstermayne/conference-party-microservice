#!/usr/bin/env node
/**
 * TOOL #3: CODESPACES DEV ACCELERATOR
 * One-command development environment for GitHub Codespaces
 * - PWA dev server with live reload
 * - API proxy to production Firebase Functions  
 * - Real-time Firebase logs streaming
 * - Codespaces port forwarding optimization
 */

const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');
const https = require('https');
const { spawn } = require('child_process');

// Configuration
const CONFIG = {
    PWA_PORT: 3000,
    WEBSOCKET_PORT: 3001,
    FIREBASE_API_BASE: 'https://us-central1-conference-party-app.cloudfunctions.net',
    PWA_DIR: path.join(__dirname, '../public'),
    TOOLS_DIR: path.join(__dirname),
    LOG_COLORS: {
        PWA: '\x1b[36m',      // Cyan
        API: '\x1b[33m',      // Yellow  
        FIREBASE: '\x1b[31m', // Red
        RELOAD: '\x1b[32m',   // Green
        RESET: '\x1b[0m'      // Reset
    }
};

// Logging utility
function log(category, message) {
    const timestamp = new Date().toLocaleTimeString();
    const color = CONFIG.LOG_COLORS[category] || CONFIG.LOG_COLORS.RESET;
    console.log(`${color}[${timestamp}] [${category}]${CONFIG.LOG_COLORS.RESET} ${message}`);
}

// WebSocket server for live reload
let wss;
function startWebSocketServer() {
    wss = new WebSocket.Server({ port: CONFIG.WEBSOCKET_PORT });
    log('RELOAD', `WebSocket server started on port ${CONFIG.WEBSOCKET_PORT}`);
    
    wss.on('connection', (ws) => {
        log('RELOAD', 'Browser connected for live reload');
        ws.send(JSON.stringify({ type: 'connected', message: 'Live reload active' }));
    });
    
    return wss;
}

// Live reload functionality
function setupLiveReload() {
    const watcher = chokidar.watch([
        CONFIG.PWA_DIR + '/**/*.html',
        CONFIG.PWA_DIR + '/**/*.js',
        CONFIG.PWA_DIR + '/**/*.css',
        CONFIG.PWA_DIR + '/**/*.json'
    ], {
        ignored: /node_modules/,
        persistent: true
    });
    
    watcher.on('change', (filePath) => {
        const relativePath = path.relative(CONFIG.PWA_DIR, filePath);
        log('RELOAD', `File changed: ${relativePath}`);
        
        if (wss) {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({
                        type: 'reload',
                        file: relativePath,
                        timestamp: Date.now()
                    }));
                }
            });
        }
    });
    
    log('RELOAD', `Watching ${CONFIG.PWA_DIR} for changes`);
    return watcher;
}

// Inject live reload script into HTML
function injectLiveReloadScript(html) {
    const liveReloadScript = `
    <script>
        (function() {
            const ws = new WebSocket('ws://localhost:${CONFIG.WEBSOCKET_PORT}');
            
            ws.onmessage = function(event) {
                const data = JSON.parse(event.data);
                if (data.type === 'reload') {
                    console.log('🔄 Live reload: ' + data.file);
                    window.location.reload();
                } else if (data.type === 'connected') {
                    console.log('🔌 Live reload connected');
                }
            };
            
            ws.onopen = function() {
                console.log('🚀 Dev Accelerator: Live reload active');
            };
            
            ws.onerror = function() {
                console.warn('⚠️  Live reload disconnected');
            };
        })();
    </script>
    `;
    
    return html.replace('</head>', liveReloadScript + '</head>');
}

// Enhanced static file middleware with live reload injection
function createStaticMiddleware() {
    return (req, res, next) => {
        if (req.path === '/' || req.path === '/index.html') {
            const indexPath = path.join(CONFIG.PWA_DIR, 'index.html');
            
            if (fs.existsSync(indexPath)) {
                let html = fs.readFileSync(indexPath, 'utf8');
                html = injectLiveReloadScript(html);
                
                res.setHeader('Content-Type', 'text/html');
                res.send(html);
                return;
            }
        }
        
        next();
    };
}

// Firebase API proxy
function createFirebaseProxy() {
    return createProxyMiddleware('/api', {
        target: CONFIG.FIREBASE_API_BASE,
        changeOrigin: true,
        logLevel: 'silent',
        onProxyReq: (proxyReq, req, res) => {
            log('API', `${req.method} ${req.url} → Firebase`);
        },
        onProxyRes: (proxyRes, req, res) => {
            log('API', `${req.method} ${req.url} ← ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            log('API', `Proxy error: ${err.message}`);
            res.status(500).json({ error: 'API proxy error', details: err.message });
        }
    });
}

// Firebase logs streaming
function startFirebaseLogsStream() {
    log('FIREBASE', 'Starting Firebase logs stream...');
    
    // Use the existing Firebase manager for logs if available
    const firebaseManager = path.join(CONFIG.TOOLS_DIR, 'firebase-manager.js');
    
    if (fs.existsSync(firebaseManager)) {
        const logProcess = spawn('node', [firebaseManager, 'logs'], { 
            stdio: ['pipe', 'pipe', 'pipe'] 
        });
        
        logProcess.stdout.on('data', (data) => {
            const lines = data.toString().split('\n').filter(line => line.trim());
            lines.forEach(line => {
                if (line.includes('ERROR') || line.includes('WARN')) {
                    log('FIREBASE', `🔥 ${line}`);
                } else if (line.includes('INFO')) {
                    log('FIREBASE', `ℹ️  ${line}`);
                }
            });
        });
        
        logProcess.stderr.on('data', (data) => {
            log('FIREBASE', `❌ ${data.toString().trim()}`);
        });
        
        return logProcess;
    } else {
        log('FIREBASE', '⚠️  Firebase manager not found, skipping log streaming');
        return null;
    }
}

// Health check for Firebase Functions
async function checkFirebaseHealth() {
    return new Promise((resolve) => {
        const healthUrl = `${CONFIG.FIREBASE_API_BASE}/api/health`;
        
        https.get(healthUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const health = JSON.parse(data);
                    log('FIREBASE', `✅ Functions healthy (${health.responseTime || 'unknown'})`);
                    resolve(true);
                } catch (error) {
                    log('FIREBASE', `❌ Health check failed: ${error.message}`);
                    resolve(false);
                }
            });
        }).on('error', (error) => {
            log('FIREBASE', `❌ Health check error: ${error.message}`);
            resolve(false);
        });
    });
}

// Codespaces environment detection and optimization
function detectCodespacesEnvironment() {
    const isCodespaces = process.env.CODESPACES === 'true';
    const codespaceName = process.env.CODESPACE_NAME;
    
    if (isCodespaces) {
        log('PWA', `🚀 GitHub Codespaces detected: ${codespaceName}`);
        log('PWA', `📱 PWA will be available at forwarded port ${CONFIG.PWA_PORT}`);
        return { isCodespaces: true, name: codespaceName };
    } else {
        log('PWA', '💻 Local development mode');
        return { isCodespaces: false, name: null };
    }
}

// Main Dev Accelerator
async function startDevAccelerator() {
    console.log('\n🚀 TOOL #3: DEV ACCELERATOR STARTING...\n');
    
    // Environment detection
    const environment = detectCodespacesEnvironment();
    
    // Health check
    log('PWA', '🔍 Checking Firebase Functions health...');
    await checkFirebaseHealth();
    
    // Create Express app
    const app = express();
    
    // Request logging middleware
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api')) {
            log('PWA', `📄 ${req.method} ${req.path}`);
        }
        next();
    });
    
    // Live reload injection middleware
    app.use(createStaticMiddleware());
    
    // Static PWA files
    app.use(express.static(CONFIG.PWA_DIR, {
        setHeaders: (res, path) => {
            // Disable caching during development
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
        }
    }));
    
    // Firebase API proxy
    app.use(createFirebaseProxy());
    
    // 404 handler for PWA routes (SPA fallback)
    app.get('*', (req, res) => {
        const indexPath = path.join(CONFIG.PWA_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf8');
            html = injectLiveReloadScript(html);
            res.send(html);
        } else {
            res.status(404).send('PWA index.html not found');
        }
    });
    
    // Start WebSocket server for live reload
    startWebSocketServer();
    
    // Setup file watching for live reload
    const watcher = setupLiveReload();
    
    // Start Firebase logs streaming
    const logProcess = startFirebaseLogsStream();
    
    // Start PWA server
    const server = app.listen(CONFIG.PWA_PORT, () => {
        console.log('\n✅ DEV ACCELERATOR READY!\n');
        log('PWA', `🌐 Server running on port ${CONFIG.PWA_PORT}`);
        log('PWA', `📁 Serving PWA from: ${CONFIG.PWA_DIR}`);
        log('API', `🔄 Proxying /api/* to: ${CONFIG.FIREBASE_API_BASE}`);
        log('RELOAD', `🔄 Live reload active on port ${CONFIG.WEBSOCKET_PORT}`);
        
        if (environment.isCodespaces) {
            log('PWA', '📱 Use the "Ports" tab to forward port 3000 for external access');
        } else {
            log('PWA', '📱 Open: http://localhost:3000');
        }
        
        console.log('\n🎯 DEVELOPMENT WORKFLOW:');
        console.log('   1. Edit PWA files in public/ directory');
        console.log('   2. Browser auto-reloads on file changes');
        console.log('   3. API calls proxy to production Firebase');
        console.log('   4. Firebase logs stream in real-time');
        console.log('\n⌨️  Press Ctrl+C to stop\n');
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\n🛑 Shutting down Dev Accelerator...');
        
        if (watcher) watcher.close();
        if (wss) wss.close();
        if (logProcess) logProcess.kill();
        if (server) server.close();
        
        log('PWA', '👋 Dev Accelerator stopped');
        process.exit(0);
    });
}

// Error handling
process.on('uncaughtException', (error) => {
    log('PWA', `💥 Uncaught exception: ${error.message}`);
    console.error(error.stack);
});

process.on('unhandledRejection', (reason, promise) => {
    log('PWA', `💥 Unhandled rejection: ${reason}`);
    console.error('Promise:', promise);
});

// Start if run directly
if (require.main === module) {
    startDevAccelerator();
}

module.exports = { startDevAccelerator };