# Speed Optimization Tips

## Quick Commands (No Build/Test)

### Fastest Deploy (2-3 seconds)
```bash
npm run qd
```
This only:
- Bumps version
- Deploys hosting (skips functions)

### Quick Ship (Deploy + Commit)
```bash
./quick-deploy.sh && git add -A && git commit -m "quick fix"
```

## What Makes It Slow

1. **Build Process** (~4 seconds)
   - Generates service worker
   - Creates manifest
   - Builds offline search
   - Solution: Skip with `npm run qd`

2. **Test Suite** (~5 seconds)  
   - Tests 5 API endpoints
   - Network latency adds delay
   - Solution: Test only when needed

3. **Firebase Deploy**
   - Functions deploy: ~30 seconds
   - Hosting deploy: ~5 seconds
   - Solution: Use `--only hosting`

## Recommended Workflow

### For Frontend Changes (CSS/JS)
```bash
# Fast iteration (5 seconds total)
npm run qd

# With commit (7 seconds)
npm run qd && git add -A && git commit -m "fix: description"
```

### For Functions Changes
```bash
# Must deploy functions (slower, ~35 seconds)
cd functions && npm run deploy
```

### For Testing Locally
```bash
# Skip deploy entirely
npm run dev  # http://localhost:3000
```

## Pro Tips

1. **Use `npm run qd`** instead of `npm run deploy` for frontend
2. **Skip tests** during rapid iteration
3. **Batch commits** - deploy multiple times, commit once
4. **Use local dev** for CSS/JS testing before deploy

## Aliases Available

After running `source .bash_aliases`:
- `qd` - Quick deploy
- `gac "message"` - Git add & commit
- `ship` - Deploy + commit in one command