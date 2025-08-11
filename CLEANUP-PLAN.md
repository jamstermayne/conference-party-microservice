# CODEBASE CLEANUP PLAN

## 1. GitHub Workflows (HIGH PRIORITY)

### Remove Duplicate/Failing Workflows
```bash
# Remove failing duplicate
rm .github/workflows/ci-cd-pipeline.yml

# Remove terraform workflow (not used)
rm .github/workflows/terraform-deploy.yml  

# Keep only essential workflows:
# - test-and-deploy.yml (main CI/CD)
# - protection.yml (security & quality)
# - deploy-clean.yml (clean deploy)
```

### Workflows to Keep
- `test-and-deploy.yml` - Main CI/CD pipeline
- `protection.yml` - Security and branch protection
- `deploy-clean.yml` - Clean deployment workflow
- `security-audit.yml` - Security scanning

## 2. Console Statements Cleanup

### Remove Production Console Logs
```javascript
// Replace console.log/info/debug with conditional logging
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug message');
}
```

### Files with Most Console Statements
- Check all 77 JS files for production console usage
- Keep only essential error logging
- Use proper logging library

## 3. Documentation Consolidation

### Merge Patch Documentation
```bash
# Consolidate into single PATCHES-IMPLEMENTED.md
cat PATCH-*.md > PATCHES-IMPLEMENTED.md
rm PATCH-*.md
```

### Current Patch Files
- PATCH-F-DEPLOYMENT.md
- PATCH-G-H-DEPLOYMENT.md  
- PATCH-I-DEPLOYMENT.md
- PATCH-K-DEPLOYMENT.md
- PRODUCTION-DEPLOYMENT-STATUS.md

## 4. JavaScript Module Deduplication

### Duplicate Modules Found
```
frontend/src/js/
├── metrics.js          # Keep (updated in Patch K)
├── metrics-shim.js     # Remove (old shim)
├── analytics.js        # Review for removal
├── analytics-core.js   # Review for removal
├── auth.js            # Keep
├── auth-enhanced.js   # Review for consolidation
├── auth-view.js       # Review for consolidation
```

### Consolidation Strategy
1. Single metrics implementation
2. Single auth module
3. Single analytics system
4. Remove all shims and duplicates

## 5. Unused Dependencies

### Check package.json
```bash
# Run dependency check
npx depcheck

# Remove unused packages
npm uninstall <unused-package>
```

## 6. Test File Cleanup

### Remove Obsolete Tests
- Check for tests of removed features
- Update test snapshots
- Remove .test.js.bak files if any

## 7. Build Artifacts

### Clean Build Directories
```bash
# Remove build artifacts
rm -rf functions/lib
rm -rf frontend/dist
rm -rf .firebase
rm -rf node_modules/.cache
```

## 8. Environment Files

### Consolidate Environment Configuration
- Single .env.example file
- Remove duplicate env configurations
- Document all required environment variables

## Implementation Priority

1. **HIGH**: Remove failing workflows (ci-cd-pipeline.yml)
2. **HIGH**: Remove console statements from production code
3. **MEDIUM**: Consolidate documentation
4. **MEDIUM**: Deduplicate JavaScript modules
5. **LOW**: Clean unused dependencies
6. **LOW**: Remove build artifacts

## Estimated Impact

- **Code reduction**: ~20-30% fewer files
- **Build time**: 10-15% faster
- **Maintenance**: Much easier with single source of truth
- **Performance**: Cleaner console, smaller bundle size

## Safety Checklist

Before removing any file:
- [ ] Check if it's imported anywhere
- [ ] Verify it's not used in production
- [ ] Create backup branch
- [ ] Test after removal

## Commands to Execute

```bash
# 1. Create cleanup branch
git checkout -b cleanup/codebase-consolidation

# 2. Remove duplicate workflows
rm .github/workflows/ci-cd-pipeline.yml
rm .github/workflows/terraform-deploy.yml

# 3. Consolidate documentation
cat PATCH-*.md > PATCHES-IMPLEMENTED.md

# 4. Test everything still works
npm test
npm run build

# 5. Commit and push
git add .
git commit -m "🧹 Codebase cleanup: Remove duplicates and consolidate"
git push
```