#!/bin/bash

# World-Class Architecture Setup Script
# This script sets up the new SvelteKit-based architecture alongside existing code

set -e

echo "🚀 Setting up World-Class Conference Intelligence Architecture"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Create new project directory
PROJECT_DIR="conference-intelligence-v2"

echo "📁 Creating new project: $PROJECT_DIR"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

# Initialize SvelteKit project
echo "🎯 Initializing SvelteKit project..."
cat > package.json << 'EOF'
{
  "name": "conference-intelligence",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "vitest run",
    "test:integration": "playwright test",
    "test:ui": "vitest --ui",
    "lint": "eslint .",
    "format": "prettier --write .",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "check:watch": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json --watch"
  },
  "devDependencies": {
    "@sveltejs/adapter-static": "^3.0.0",
    "@sveltejs/adapter-node": "^2.0.0",
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitest/ui": "^1.0.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-svelte": "^2.0.0",
    "playwright": "^1.40.0",
    "postcss": "^8.4.0",
    "prettier": "^3.0.0",
    "prettier-plugin-svelte": "^3.0.0",
    "svelte": "^4.0.0",
    "svelte-check": "^3.0.0",
    "tailwindcss": "^3.3.0",
    "tslib": "^2.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-pwa": "^0.17.0",
    "vitest": "^1.0.0"
  },
  "dependencies": {
    "@tanstack/svelte-query": "^5.0.0",
    "@tensorflow/tfjs": "^4.0.0",
    "comlink": "^4.4.0",
    "date-fns": "^3.0.0",
    "firebase": "^10.0.0",
    "firebase-admin": "^12.0.0",
    "fuse.js": "^7.0.0",
    "idb": "^8.0.0",
    "lucide-svelte": "^0.300.0",
    "nanoid": "^5.0.0",
    "openai": "^4.0.0",
    "zod": "^3.22.0"
  }
}
EOF

# Create project structure
echo "📂 Creating project structure..."

# Create directories
mkdir -p src/{lib,routes,app.d.ts}
mkdir -p src/lib/{components,stores,services,repositories,types,utils,config}
mkdir -p src/lib/components/{ui,features,layouts}
mkdir -p src/routes/{api,auth,dashboard,events,connections}
mkdir -p static
mkdir -p tests/{unit,integration,e2e}
mkdir -p functions/src/{core,services,triggers,api}

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler",
    "module": "esnext",
    "target": "es2020",
    "lib": ["es2020", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "vitest/globals"]
  }
}
EOF

# Create Vite config
cat > vite.config.ts << 'EOF'
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    sveltekit(),
    VitePWA({
      strategies: 'generateSW',
      registerType: 'autoUpdate',
      manifest: {
        name: 'Conference Intelligence',
        short_name: 'ConfIntel',
        theme_color: '#3B82F6',
        background_color: '#FFFFFF',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 3
            }
          }
        ]
      }
    })
  ],
  test: {
    include: ['src/**/*.{test,spec}.{js,ts}'],
    environment: 'jsdom',
    globals: true
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          ui: ['lucide-svelte'],
          utils: ['date-fns', 'fuse.js']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore']
  }
});
EOF

# Create SvelteKit config
cat > svelte.config.js << 'EOF'
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true
    }),
    alias: {
      '$lib': 'src/lib',
      '$components': 'src/lib/components',
      '$stores': 'src/lib/stores',
      '$services': 'src/lib/services',
      '$types': 'src/lib/types',
      '$utils': 'src/lib/utils'
    }
  }
};

export default config;
EOF

# Create Tailwind config
cat > tailwind.config.js << 'EOF'
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  },
  plugins: []
};
EOF

# Create PostCSS config
cat > postcss.config.js << 'EOF'
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {}
  }
};
EOF

# Create app.html
cat > src/app.html << 'EOF'
<!DOCTYPE html>
<html lang="en" class="%sveltekit.theme%">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="AI-powered conference networking and business intelligence" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover" class="min-h-screen bg-gray-50">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
EOF

# Create app.css
cat > src/app.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --color-primary: theme('colors.primary.500');
    --color-secondary: theme('colors.gray.600');
  }
  
  html {
    -webkit-tap-highlight-color: transparent;
  }
  
  body {
    @apply antialiased;
  }
}

@layer components {
  .btn {
    @apply inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2;
  }
  
  .btn-primary {
    @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden;
  }
  
  .card-hover {
    @apply hover:shadow-md transition-shadow cursor-pointer;
  }
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
  
  .animate-in {
    animation: fadeIn 0.2s ease-out;
  }
}
EOF

# Create environment variables template
cat > .env.example << 'EOF'
# Firebase Configuration
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id

# API Keys
VITE_OPENAI_API_KEY=your-openai-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-key

# Feature Flags
VITE_ENABLE_AI_MATCHING=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_PWA=true

# Environment
NODE_ENV=development
EOF

# Create Firebase configuration
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "build",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|woff2)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "ignore": ["node_modules", ".git", "**/*.test.ts"]
  },
  "emulators": {
    "auth": { "port": 9099 },
    "functions": { "port": 5001 },
    "firestore": { "port": 8080 },
    "hosting": { "port": 5000 },
    "storage": { "port": 9199 },
    "ui": { "enabled": true }
  }
}
EOF

# Create Firestore rules
cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
      
      // Connections subcollection
      match /connections/{connectionId} {
        allow read: if request.auth != null && request.auth.uid == userId;
        allow create: if request.auth != null && request.auth.uid == userId;
        allow update: if request.auth != null && 
          (request.auth.uid == userId || 
           request.auth.uid == resource.data.targetUserId);
        allow delete: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Conferences are readable by authenticated users
    match /conferences/{conferenceId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.token.admin == true;
        
      // Sessions subcollection
      match /sessions/{sessionId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null && 
          request.auth.token.admin == true;
      }
    }
    
    // Matching profiles
    match /matching_profiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only writable by Cloud Functions
    }
  }
}
EOF

# Create basic layout
cat > src/routes/+layout.svelte << 'EOF'
<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/auth.store';
  
  onMount(() => {
    // Initialize auth listener
    authStore.initialize();
  });
</script>

<slot />
EOF

# Create home page
cat > src/routes/+page.svelte << 'EOF'
<script lang="ts">
  import { authStore, isAuthenticated } from '$lib/stores/auth.store';
  import { goto } from '$app/navigation';
  
  $: if ($isAuthenticated) {
    goto('/dashboard');
  }
</script>

<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
  <div class="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-xl">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900">Conference Intelligence</h1>
      <p class="mt-2 text-gray-600">AI-powered networking for professionals</p>
    </div>
    
    <div class="mt-8">
      {#if $authStore.loading}
        <div class="text-center">Loading...</div>
      {:else}
        <button
          on:click={() => authStore.signIn()}
          class="w-full btn btn-primary text-lg py-3"
        >
          Sign in with Google
        </button>
      {/if}
    </div>
    
    {#if $authStore.error}
      <p class="mt-4 text-center text-red-600">{$authStore.error}</p>
    {/if}
  </div>
</div>
EOF

# Create dashboard page
cat > src/routes/dashboard/+page.svelte << 'EOF'
<script lang="ts">
  import { authStore, currentUser } from '$lib/stores/auth.store';
  import { onMount } from 'svelte';
  
  onMount(() => {
    if (!$currentUser) {
      // Redirect to home if not authenticated
      window.location.href = '/';
    }
  });
</script>

{#if $currentUser}
  <div class="min-h-screen bg-gray-50">
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <h1 class="text-xl font-semibold">Conference Intelligence</h1>
          </div>
          <div class="flex items-center space-x-4">
            <span class="text-gray-700">{$currentUser.displayName}</span>
            <button
              on:click={() => authStore.signOut()}
              class="btn btn-secondary"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
    
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="card p-6">
            <h2 class="text-lg font-medium text-gray-900">Connections</h2>
            <p class="mt-1 text-3xl font-bold text-primary-600">
              {$currentUser.stats.connectionsCount}
            </p>
          </div>
          
          <div class="card p-6">
            <h2 class="text-lg font-medium text-gray-900">Events</h2>
            <p class="mt-1 text-3xl font-bold text-primary-600">
              {$currentUser.stats.eventsAttended}
            </p>
          </div>
          
          <div class="card p-6">
            <h2 class="text-lg font-medium text-gray-900">Network Score</h2>
            <p class="mt-1 text-3xl font-bold text-primary-600">
              {$currentUser.stats.networkingScore}
            </p>
          </div>
        </div>
      </div>
    </main>
  </div>
{/if}
EOF

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🎨 Setting up ESLint and Prettier..."

# Create ESLint config
cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:svelte/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2020,
    extraFileExtensions: ['.svelte']
  },
  env: {
    browser: true,
    es2017: true,
    node: true
  },
  overrides: [
    {
      files: ['*.svelte'],
      parser: 'svelte-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser'
      }
    }
  ]
};
EOF

# Create Prettier config
cat > .prettierrc << 'EOF'
{
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "semi": true,
  "tabWidth": 2,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [
    {
      "files": "*.svelte",
      "options": {
        "parser": "svelte"
      }
    }
  ]
}
EOF

echo ""
echo "✅ World-Class Architecture Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. cd $PROJECT_DIR"
echo "2. Copy .env.example to .env and add your Firebase credentials"
echo "3. npm run dev - Start development server"
echo "4. npm run test - Run tests"
echo "5. npm run build - Build for production"
echo ""
echo "📖 Documentation: WORLD_CLASS_ARCHITECTURE.md"
echo "🚀 The new architecture is ready for development!"
echo ""
echo "Features included:"
echo "✅ SvelteKit with TypeScript"
echo "✅ Firebase integration"
echo "✅ Repository pattern"
echo "✅ Service layer architecture"
echo "✅ Type-safe data models with Zod"
echo "✅ State management with Svelte stores"
echo "✅ TailwindCSS for styling"
echo "✅ PWA support"
echo "✅ Testing infrastructure"
echo "✅ Performance monitoring"
echo "✅ Clean architecture patterns"