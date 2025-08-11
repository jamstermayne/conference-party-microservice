# 🛡️ Branch Protection Setup Guide

## Repository Protection Settings

### Required Branch Protection Rules (Main Branch)

```bash
# Navigate to: GitHub Repository → Settings → Branches → Add Rule

Branch name pattern: main

☑️ Require pull request reviews before merging
  • Required approving reviews: 1
  • Dismiss stale PR approvals when new commits are pushed
  
☑️ Require status checks to pass before merging
  • Require branches to be up to date before merging
  • Required status checks:
    - build (npm run build)
    - test (npm test - all 91 tests)
    - lint (npm run lint)
    - security-audit (npm audit)

☑️ Require conversation resolution before merging

☑️ Include administrators (apply rules to admins)

☑️ Restrict pushes that create files that match a patterns
  • Restricted paths: 
    - *.env (prevent secrets)
    - node_modules/** (prevent large files)
```

## Status Check Requirements

### Required Checks (GitHub Actions)
- ✅ **Build Process**: `npm run build` must succeed
- ✅ **Test Suite**: All 91 tests must pass (`npm test`)
- ✅ **Code Quality**: ESLint must pass (`npm run lint`)
- ✅ **Security**: No high/critical vulnerabilities (`npm audit`)
- ✅ **Coverage**: Maintain current test coverage levels

### Performance Requirements
- API response time < 2000ms average
- Build time < 5 minutes
- Test execution < 3 minutes

## Repository Settings

### Security Settings
```bash
# Navigate to: Settings → Code security and analysis

☑️ Dependency graph
☑️ Dependabot alerts  
☑️ Dependabot security updates
☑️ Dependabot version updates
☑️ Code scanning (CodeQL)
☑️ Secret scanning
```

### Collaboration Settings
```bash
# Navigate to: Settings → General

☑️ Restrict creation of public repositories
☑️ Restrict repository visibility changes
☑️ Restrict forking of private repositories
☑️ Allow merge commits
☑️ Allow squash merging
☑️ Allow rebase merging
☑️ Automatically delete head branches
```

## Manual Setup Steps

1. **Go to Repository Settings**
   ```
   https://github.com/jamstermayne/conference-party-microservice/settings/branches
   ```

2. **Add Branch Protection Rule**
   - Branch name: `main`
   - Apply all settings from above

3. **Verify Protection is Active**
   ```bash
   gh api repos/jamstermayne/conference-party-microservice/branches/main/protection
   ```

4. **Test Protection (Create Test PR)**
   ```bash
   git checkout -b test/branch-protection
   echo "# Test" >> TEST.md
   git add TEST.md
   git commit -m "test: branch protection"
   git push -u origin test/branch-protection
   gh pr create --title "Test: Branch Protection" --body "Testing branch protection rules"
   ```

## CI/CD Integration

Branch protection works with GitHub Actions workflow:

```yaml
# .github/workflows/test-and-deploy.yml
name: Test and Deploy
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      
  test:
    runs-on: ubuntu-latest  
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm test
```

## Protection Benefits

- ✅ **Prevents broken code** from reaching main
- ✅ **Enforces code review** for all changes  
- ✅ **Maintains test quality** with 91/91 tests
- ✅ **Security validation** with npm audit
- ✅ **Consistent code style** with ESLint
- ✅ **Deployment safety** with status checks

Repository protection is now documented and ready for manual setup by repository administrators.