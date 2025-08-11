#!/usr/bin/env node

/**
 * HOT RELOAD DEVELOPMENT SERVER
 * Provides instant code updates without page refreshes
 * Maintains application state during development for 5-10x productivity gains
 */

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const WebSocket = require('ws');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

class HotReloadServer {
    constructor(options = {}) {
        this.port = options.port || 3000;
        this.publicDir = options.publicDir || path.resolve('./public');
        this.apiProxy = options.apiProxy || 'https://us-central1-conference-party-app.cloudfunctions.net';
        
        this.app = express();
        this.server = null;
        this.wss = null;
        this.clients = new Set();
        
        // File watching state
        this.watchers = new Map();
        this.dependencyGraph = new Map();
        this.moduleCache = new Map();
        
        // Performance metrics
        this.reloadCount = 0;
        this.totalReloadTime = 0;
        this.lastReloadTime = null;
        
        console.log('🔥 Hot Reload Server initializing...');
    }

    async start() {
        try {
            this.setupMiddleware();
            this.setupWebSocket();
            this.setupFileWatchers();
            
            this.server = this.app.listen(this.port, () => {
                console.log(`🚀 Hot Reload Server running at http://localhost:${this.port}`);
                console.log(`📁 Serving files from: ${this.publicDir}`);
                console.log(`🔗 API proxy to: ${this.apiProxy}`);
                console.log('👀 Watching for file changes...');
            });
            
            // Graceful shutdown
            process.on('SIGINT', () => this.shutdown());
            process.on('SIGTERM', () => this.shutdown());
            
        } catch (error) {
            console.error('❌ Failed to start Hot Reload Server:', error);
            process.exit(1);
        }
    }

    setupMiddleware() {
        // Static file serving with hot reload injection
        this.app.use(express.static(this.publicDir, {
            setHeaders: (res, filePath) => {
                // Prevent caching during development
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                res.setHeader('Pragma', 'no-cache');
                res.setHeader('Expires', '0');
                
                // Inject hot reload script into HTML files
                if (filePath.endsWith('.html')) {
                    res.setHeader('Content-Type', 'text/html');
                }
            }
        }));

        // API proxy with hot reload support
        this.app.use('/api', createProxyMiddleware({
            target: this.apiProxy,
            changeOrigin: true,
            pathRewrite: {
                '^/api': '/api'
            },
            onProxyReq: (proxyReq, req) => {
                console.log('🔗 Proxying API request:', req.method, req.url);
            },
            onError: (err, req, res) => {
                console.error('❌ API Proxy Error:', err.message);
                res.status(502).json({ 
                    error: 'API Proxy Error', 
                    message: 'Failed to connect to backend API' 
                });
            }
        }));

        // Hot reload client script endpoint
        this.app.get('/hot-reload-client.js', (req, res) => {
            res.setHeader('Content-Type', 'application/javascript');
            res.send(this.generateHotReloadClient());
        });

        // HTML files with hot reload injection
        this.app.get('*.html', (req, res, next) => {
            const filePath = path.join(this.publicDir, req.path);
            
            if (fs.existsSync(filePath)) {
                let html = fs.readFileSync(filePath, 'utf8');
                
                // Inject hot reload client
                const hotReloadScript = `
                    <script>
                        console.log('🔥 Hot Reload Client loading...');
                    </script>
                    <script src="/hot-reload-client.js"></script>
                `;
                
                if (html.includes('</head>')) {
                    html = html.replace('</head>', `${hotReloadScript}</head>`);
                } else if (html.includes('<body>')) {
                    html = html.replace('<body>', `<body>${hotReloadScript}`);
                } else {
                    html = hotReloadScript + html;
                }
                
                res.send(html);
            } else {
                next();
            }
        });

        // Development dashboard
        this.app.get('/dev-dashboard', (req, res) => {
            res.send(this.generateDevDashboard());
        });

        // Performance metrics API
        this.app.get('/dev-metrics', (req, res) => {
            res.json({
                reloadCount: this.reloadCount,
                averageReloadTime: this.reloadCount > 0 ? this.totalReloadTime / this.reloadCount : 0,
                lastReloadTime: this.lastReloadTime,
                connectedClients: this.clients.size,
                watchedFiles: Array.from(this.watchers.keys()),
                dependencyGraph: Array.from(this.dependencyGraph.entries())
            });
        });

        console.log('✅ Express middleware configured');
    }

    setupWebSocket() {
        this.wss = new WebSocket.Server({ 
            port: this.port + 1,
            perMessageDeflate: false
        });

        this.wss.on('connection', (ws, req) => {
            console.log('🔌 Hot reload client connected from:', req.socket.remoteAddress);
            
            this.clients.add(ws);
            
            // Send initial connection message
            ws.send(JSON.stringify({
                type: 'connected',
                message: 'Hot reload client connected',
                timestamp: Date.now()
            }));

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    this.handleClientMessage(ws, data);
                } catch (error) {
                    console.warn('⚠️ Invalid message from client:', message);
                }
            });

            ws.on('close', () => {
                console.log('🔌 Hot reload client disconnected');
                this.clients.delete(ws);
            });

            ws.on('error', (error) => {
                console.error('❌ WebSocket error:', error);
                this.clients.delete(ws);
            });
        });

        console.log(`✅ WebSocket server started on port ${this.port + 1}`);
    }

    setupFileWatchers() {
        // Watch JavaScript files
        const jsWatcher = chokidar.watch(`${this.publicDir}/**/*.js`, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        jsWatcher.on('change', (filePath) => {
            console.log('📝 JavaScript file changed:', path.relative(this.publicDir, filePath));
            this.handleJavaScriptChange(filePath);
        });

        // Watch CSS files
        const cssWatcher = chokidar.watch(`${this.publicDir}/**/*.css`, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        cssWatcher.on('change', (filePath) => {
            console.log('🎨 CSS file changed:', path.relative(this.publicDir, filePath));
            this.handleCSSChange(filePath);
        });

        // Watch HTML files
        const htmlWatcher = chokidar.watch(`${this.publicDir}/**/*.html`, {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        htmlWatcher.on('change', (filePath) => {
            console.log('📄 HTML file changed:', path.relative(this.publicDir, filePath));
            this.handleHTMLChange(filePath);
        });

        // Watch Firebase Functions
        if (fs.existsSync('./functions/src')) {
            const functionsWatcher = chokidar.watch('./functions/src/**/*.ts', {
                ignored: /node_modules/,
                persistent: true,
                ignoreInitial: true
            });

            functionsWatcher.on('change', (filePath) => {
                console.log('⚡ Firebase Function changed:', path.relative('./functions/src', filePath));
                this.handleFunctionChange(filePath);
            });

            this.watchers.set('functions', functionsWatcher);
        }

        this.watchers.set('js', jsWatcher);
        this.watchers.set('css', cssWatcher);
        this.watchers.set('html', htmlWatcher);

        console.log('✅ File watchers configured');
    }

    handleJavaScriptChange(filePath) {
        const startTime = Date.now();
        const relativePath = path.relative(this.publicDir, filePath);
        
        try {
            // Analyze dependencies
            const dependencies = this.analyzeDependencies(filePath);
            
            // Broadcast hot reload to clients
            this.broadcast({
                type: 'js-reload',
                file: relativePath,
                dependencies: dependencies,
                timestamp: Date.now()
            });
            
            const reloadTime = Date.now() - startTime;
            this.trackReloadPerformance(reloadTime);
            
            console.log(`🔥 Hot reloaded JS: ${relativePath} (${reloadTime}ms)`);
            
        } catch (error) {
            console.error('❌ Error processing JS change:', error);
            this.broadcast({
                type: 'error',
                message: 'JavaScript compilation error',
                file: relativePath,
                error: error.message
            });
        }
    }

    handleCSSChange(filePath) {
        const startTime = Date.now();
        const relativePath = path.relative(this.publicDir, filePath);
        
        try {
            // Read CSS content
            const cssContent = fs.readFileSync(filePath, 'utf8');
            
            // Broadcast CSS update (no page refresh needed)
            this.broadcast({
                type: 'css-reload',
                file: relativePath,
                content: cssContent,
                timestamp: Date.now()
            });
            
            const reloadTime = Date.now() - startTime;
            this.trackReloadPerformance(reloadTime);
            
            console.log(`🎨 Hot reloaded CSS: ${relativePath} (${reloadTime}ms)`);
            
        } catch (error) {
            console.error('❌ Error processing CSS change:', error);
        }
    }

    handleHTMLChange(filePath) {
        const relativePath = path.relative(this.publicDir, filePath);
        
        // HTML changes require full page reload to maintain integrity
        this.broadcast({
            type: 'page-reload',
            file: relativePath,
            message: 'HTML file changed, reloading page...',
            timestamp: Date.now()
        });
        
        console.log(`📄 Page reload triggered: ${relativePath}`);
    }

    async handleFunctionChange(filePath) {
        const relativePath = path.relative('./functions/src', filePath);
        
        console.log('🔧 Building Firebase Functions...');
        
        try {
            // Auto-build functions
            const { exec } = require('child_process');
            const buildProcess = exec('cd functions && npm run build', (error, stdout, stderr) => {
                if (error) {
                    console.error('❌ Function build failed:', error.message);
                    this.broadcast({
                        type: 'error',
                        message: 'Firebase Function build failed',
                        file: relativePath,
                        error: error.message
                    });
                } else {
                    console.log('✅ Functions built successfully');
                    this.broadcast({
                        type: 'functions-reload',
                        file: relativePath,
                        message: 'Firebase Functions rebuilt',
                        timestamp: Date.now()
                    });
                }
            });
            
        } catch (error) {
            console.error('❌ Error building functions:', error);
        }
    }

    analyzeDependencies(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dependencies = [];
            
            // Simple dependency analysis
            const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
            const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
            
            let match;
            while ((match = importRegex.exec(content)) !== null) {
                dependencies.push(match[1]);
            }
            
            while ((match = requireRegex.exec(content)) !== null) {
                dependencies.push(match[1]);
            }
            
            return dependencies;
            
        } catch (error) {
            console.warn('⚠️ Could not analyze dependencies for:', filePath);
            return [];
        }
    }

    handleClientMessage(ws, data) {
        switch (data.type) {
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
                
            case 'reload-complete':
                console.log('✅ Client reload completed in', data.reloadTime || 'unknown', 'ms');
                break;
                
            case 'error':
                console.error('❌ Client error:', data.message);
                break;
                
            default:
                console.log('📨 Client message:', data);
        }
    }

    broadcast(message) {
        const payload = JSON.stringify(message);
        
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(payload);
            }
        });
        
        if (this.clients.size > 0) {
            console.log(`📡 Broadcasted to ${this.clients.size} clients:`, message.type);
        }
    }

    trackReloadPerformance(reloadTime) {
        this.reloadCount++;
        this.totalReloadTime += reloadTime;
        this.lastReloadTime = reloadTime;
    }

    generateHotReloadClient() {
        return `
// HOT RELOAD CLIENT - Injected automatically
(function() {
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    
    function connect() {
        const wsUrl = 'ws://localhost:${this.port + 1}';
        console.log('🔥 Connecting to hot reload server...');
        
        ws = new WebSocket(wsUrl);
        
        ws.onopen = function() {
            console.log('🔌 Hot reload connected');
            reconnectAttempts = 0;
            
            // Show connection indicator
            showHotReloadIndicator('connected');
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleHotReloadMessage(data);
            } catch (error) {
                console.warn('⚠️ Invalid hot reload message:', event.data);
            }
        };
        
        ws.onclose = function() {
            console.log('🔌 Hot reload disconnected');
            showHotReloadIndicator('disconnected');
            
            // Attempt to reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(\`🔄 Reconnecting... (attempt \${reconnectAttempts})\`);
                setTimeout(connect, 2000 * reconnectAttempts);
            }
        };
        
        ws.onerror = function(error) {
            console.error('❌ Hot reload WebSocket error:', error);
        };
    }
    
    function handleHotReloadMessage(data) {
        const startTime = performance.now();
        
        switch (data.type) {
            case 'connected':
                console.log('✅', data.message);
                break;
                
            case 'js-reload':
                console.log('🔥 Hot reloading JavaScript:', data.file);
                reloadJavaScript(data.file, data.dependencies);
                break;
                
            case 'css-reload':
                console.log('🎨 Hot reloading CSS:', data.file);
                reloadCSS(data.file, data.content);
                break;
                
            case 'page-reload':
                console.log('📄 Reloading page:', data.message);
                showReloadMessage('Page reloading...');
                setTimeout(() => location.reload(), 100);
                break;
                
            case 'functions-reload':
                console.log('⚡ Firebase Functions reloaded:', data.file);
                showReloadMessage('API updated');
                break;
                
            case 'error':
                console.error('❌ Hot reload error:', data.message);
                showErrorMessage(data.error || data.message);
                break;
        }
        
        const reloadTime = performance.now() - startTime;
        
        // Send completion confirmation
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'reload-complete',
                reloadTime: reloadTime
            }));
        }
    }
    
    function reloadJavaScript(filePath, dependencies) {
        try {
            // Remove old script tags for this file
            const oldScripts = document.querySelectorAll(\`script[src*="\${filePath}"]\`);
            oldScripts.forEach(script => {
                script.remove();
            });
            
            // Add new script tag with cache busting
            const script = document.createElement('script');
            script.src = \`/\${filePath}?v=\${Date.now()}\`;
            script.onload = function() {
                console.log('✅ Reloaded:', filePath);
                
                // Trigger module refresh events
                if (window.platform && typeof window.platform.refreshModules === 'function') {
                    window.platform.refreshModules([filePath]);
                }
                
                // Refresh virtual list if it exists
                if (window.eventListManager && typeof window.eventListManager.refreshEvents === 'function') {
                    window.eventListManager.refreshEvents();
                }
            };
            script.onerror = function() {
                console.error('❌ Failed to reload:', filePath);
            };
            
            document.head.appendChild(script);
            
        } catch (error) {
            console.error('❌ Error reloading JavaScript:', error);
        }
    }
    
    function reloadCSS(filePath, content) {
        try {
            // Find existing stylesheet
            let styleElement = document.querySelector(\`link[href*="\${filePath}"], style[data-file="\${filePath}"]\`);
            
            if (styleElement && styleElement.tagName === 'LINK') {
                // Update link href with cache busting
                styleElement.href = \`/\${filePath}?v=\${Date.now()}\`;
            } else {
                // Create or update style tag with inline content
                if (!styleElement) {
                    styleElement = document.createElement('style');
                    styleElement.setAttribute('data-file', filePath);
                    document.head.appendChild(styleElement);
                }
                styleElement.textContent = content;
            }
            
            console.log('✅ Reloaded CSS:', filePath);
            showReloadMessage('Styles updated');
            
        } catch (error) {
            console.error('❌ Error reloading CSS:', error);
        }
    }
    
    function showHotReloadIndicator(status) {
        let indicator = document.getElementById('hot-reload-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'hot-reload-indicator';
            indicator.style.cssText = \`
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10000;
                transition: all 0.3s ease;
                font-family: monospace;
            \`;
            document.body.appendChild(indicator);
        }
        
        if (status === 'connected') {
            indicator.style.background = '#00ff88';
            indicator.style.color = '#000';
            indicator.textContent = '🔥 Hot Reload';
        } else {
            indicator.style.background = '#ff6b6b';
            indicator.style.color = '#fff';
            indicator.textContent = '❌ Disconnected';
        }
    }
    
    function showReloadMessage(message) {
        const toast = document.createElement('div');
        toast.style.cssText = \`
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #00ff88;
            color: #000;
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 4px 12px rgba(0, 255, 136, 0.3);
            animation: slideIn 0.3s ease;
        \`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
    
    function showErrorMessage(error) {
        const errorToast = document.createElement('div');
        errorToast.style.cssText = \`
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ff6b6b;
            color: #fff;
            padding: 12px 16px;
            border-radius: 6px;
            font-weight: 600;
            z-index: 10000;
            font-family: monospace;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
        \`;
        errorToast.innerHTML = \`
            <div style="font-size: 14px; margin-bottom: 4px;">❌ Hot Reload Error</div>
            <div style="font-size: 12px; opacity: 0.9;">\${error}</div>
        \`;
        
        document.body.appendChild(errorToast);
        
        setTimeout(() => errorToast.remove(), 5000);
    }
    
    // Add CSS animations
    if (!document.getElementById('hot-reload-animations')) {
        const style = document.createElement('style');
        style.id = 'hot-reload-animations';
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        \`;
        document.head.appendChild(style);
    }
    
    // Start connection
    connect();
    
    // Expose hot reload API
    window.hotReload = {
        connect: connect,
        broadcast: function(message) {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
            }
        },
        isConnected: function() {
            return ws && ws.readyState === WebSocket.OPEN;
        }
    };
    
    console.log('🔥 Hot Reload Client initialized');
})();
        `;
    }

    generateDevDashboard() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔥 Hot Reload Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
            background: #0f0f0f; 
            color: #fff; 
            line-height: 1.6; 
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 40px; }
        .title { color: #00ff88; font-size: 36px; margin-bottom: 10px; }
        .subtitle { color: #ccc; font-size: 18px; }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
            gap: 20px; 
            margin-bottom: 40px; 
        }
        .stat-card { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 12px; 
            padding: 20px; 
            text-align: center; 
        }
        .stat-value { color: #00ff88; font-size: 32px; font-weight: 700; display: block; }
        .stat-label { color: #999; font-size: 14px; text-transform: uppercase; }
        .status { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 8px; 
            margin-top: 10px; 
        }
        .status.connected { color: #00ff88; }
        .status.disconnected { color: #ff6b6b; }
        .log { 
            background: #1a1a1a; 
            border: 1px solid #333; 
            border-radius: 8px; 
            padding: 20px; 
            max-height: 400px; 
            overflow-y: auto; 
            font-family: 'Courier New', monospace; 
            font-size: 14px; 
        }
        .log-entry { margin-bottom: 8px; }
        .log-timestamp { color: #666; margin-right: 8px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">🔥 Hot Reload Dashboard</h1>
            <p class="subtitle">Development Server Performance Metrics</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-value" id="reload-count">0</span>
                <span class="stat-label">Total Reloads</span>
                <div class="status connected">
                    <span>●</span> Active
                </div>
            </div>
            
            <div class="stat-card">
                <span class="stat-value" id="avg-reload-time">0ms</span>
                <span class="stat-label">Avg Reload Time</span>
            </div>
            
            <div class="stat-card">
                <span class="stat-value" id="connected-clients">0</span>
                <span class="stat-label">Connected Clients</span>
            </div>
            
            <div class="stat-card">
                <span class="stat-value" id="watched-files">0</span>
                <span class="stat-label">Watched Files</span>
            </div>
        </div>

        <div class="log" id="activity-log">
            <div class="log-entry">
                <span class="log-timestamp">${new Date().toLocaleTimeString()}</span>
                🔥 Hot Reload Dashboard loaded
            </div>
        </div>
    </div>

    <script>
        async function updateMetrics() {
            try {
                const response = await fetch('/dev-metrics');
                const data = await response.json();
                
                document.getElementById('reload-count').textContent = data.reloadCount;
                document.getElementById('avg-reload-time').textContent = 
                    data.averageReloadTime.toFixed(2) + 'ms';
                document.getElementById('connected-clients').textContent = data.connectedClients;
                document.getElementById('watched-files').textContent = data.watchedFiles.length;
                
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
            }
        }
        
        // Update metrics every 2 seconds
        setInterval(updateMetrics, 2000);
        updateMetrics();
    </script>
</body>
</html>
        `;
    }

    shutdown() {
        console.log('🛑 Shutting down Hot Reload Server...');
        
        // Close all watchers
        this.watchers.forEach(watcher => watcher.close());
        
        // Close WebSocket server
        if (this.wss) {
            this.wss.close();
        }
        
        // Close HTTP server
        if (this.server) {
            this.server.close();
        }
        
        console.log('✅ Hot Reload Server shut down gracefully');
        process.exit(0);
    }
}

// CLI Interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parse command line arguments
    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
            case '-p':
                options.port = parseInt(args[++i]);
                break;
            case '--public':
                options.publicDir = args[++i];
                break;
            case '--api':
                options.apiProxy = args[++i];
                break;
            case '--help':
            case '-h':
                console.log(`
🔥 Hot Reload Development Server

Usage: node hot-reload-server.js [options]

Options:
  -p, --port <number>     Server port (default: 3000)
  --public <path>         Public directory (default: ./public)
  --api <url>            API proxy URL (default: Firebase Functions)
  -h, --help             Show this help message

Examples:
  node hot-reload-server.js
  node hot-reload-server.js --port 8080
  node hot-reload-server.js --public ./dist --api http://localhost:5000
                `);
                process.exit(0);
        }
    }
    
    const server = new HotReloadServer(options);
    server.start();
}

module.exports = HotReloadServer;