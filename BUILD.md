# 🔧 Build Guide

## Quick Start
```bash
npm run build           # Build TypeScript
npm run build:watch     # Watch mode
npm run clean          # Clean build artifacts
```

## Build Process
1. **TypeScript Compilation** (`tsc`)
   - Source: `src/` → Output: `lib/`
   - Strict mode enabled
   - ES2017 target for Node 22

2. **Build Validation**
   ```bash
   npm run build
   npm run lint          # ESLint validation
   npm run test:ci       # Full test suite
   ```

## Build Outputs
- `lib/index.js` - Main Firebase function
- `lib/*.js` - Compiled modules
- `lib/*.js.map` - Source maps for debugging

## Production Build
```bash
npm run quality:check   # Full pipeline
# Runs: lint → build → test → security audit
```

## Troubleshooting
- **Build fails**: Check TypeScript errors with `tsc --noEmit`
- **Slow builds**: Use `npm run build:watch` for development
- **Clean slate**: Run `npm run clean` to remove all artifacts