# 🔬 Surgical Toolkit

A comprehensive suite of tools for making precise, safe changes to your codebase without breaking existing features.

## Overview

The Surgical Toolkit provides intelligent tools that analyze, isolate, and safely modify code with automatic validation and rollback capabilities. Perfect for refactoring, feature development, and maintaining large codebases.

## 🛠️ Tools Included

### 1. Impact Analyzer (`impact-analyzer.js`)
Analyzes the potential impact of code changes before implementation.

**Features:**
- Find direct and indirect dependents
- Identify affected tests and components
- Calculate risk levels (LOW/MEDIUM/HIGH/CRITICAL)
- Detect breaking changes
- Generate recommendations

**Usage:**
```bash
# Analyze impact of changing a file
node tools/surgical-toolkit/impact-analyzer.js src/components/Card.jsx

# Output as JSON
node tools/surgical-toolkit/impact-analyzer.js src/api/auth.js --json

# Save report
node tools/surgical-toolkit/impact-analyzer.js src/styles/main.css --save report.json
```

### 2. Feature Isolator (`feature-isolator.js`)
Creates isolated sandboxes for feature development without affecting main code.

**Features:**
- Feature flags with runtime switching
- File proxies for A/B testing
- Automatic environment detection
- One-click rollback
- Keyboard shortcuts (Ctrl+Shift+F)

**Usage:**
```bash
# Create isolated feature
node tools/surgical-toolkit/feature-isolator.js create dark-mode src/theme.css src/theme.js

# List isolated features
node tools/surgical-toolkit/feature-isolator.js list

# Rollback feature
node tools/surgical-toolkit/feature-isolator.js rollback dark-mode
```

**Activation Methods:**
- URL Parameter: `?feature=dark-mode`
- Browser Console: `darkModeIsolation.enable()`
- Environment: `export FEATURE_DARK_MODE=true`
- Keyboard: `Ctrl+Shift+F` to toggle

### 3. Safe Refactor (`safe-refactor.js`)
Performs controlled refactoring with automatic validation and rollback.

**Features:**
- Safe rename across codebase
- Extract functions/components
- Inline variables/functions
- Change function signatures
- Automatic test validation
- Instant rollback on failure

**Usage:**
```bash
# Rename across codebase
node tools/surgical-toolkit/safe-refactor.js rename oldFunction newFunction

# Extract code to new file
node tools/surgical-toolkit/safe-refactor.js extract src/app.js:10:50 src/utils/helper.js

# Inline a variable
node tools/surgical-toolkit/safe-refactor.js inline CONSTANT_VALUE

# Change function signature
node tools/surgical-toolkit/safe-refactor.js signature doWork "async doWork(data, options = {})"
```

### 4. Master Surgical Toolkit (`index.js`)
Orchestrates all tools for complex surgical operations.

**Features:**
- Pre-flight checks (git, tests, lint, build)
- Surgical plan creation
- Coordinated execution
- Automatic rollback
- Comprehensive reporting

**Usage:**
```bash
# Run pre-flight checks
node tools/surgical-toolkit/index.js preflight src/api.js src/auth.js

# Quick rename
node tools/surgical-toolkit/index.js rename oldName newName

# Execute surgical plan
node tools/surgical-toolkit/index.js execute surgery-plan.json

# Interactive mode (guided)
node tools/surgical-toolkit/index.js interactive
```

## 🎯 Key Features

### Risk Assessment
Every change is analyzed for risk:
- **🟢 LOW**: Safe changes with minimal impact
- **🟡 MEDIUM**: Moderate risk, proceed with caution
- **🟠 HIGH**: High impact, consider breaking into smaller changes
- **🔴 CRITICAL**: Very high risk, requires isolation and extensive testing

### Automatic Safety Measures
- **Backups**: Every modified file is backed up
- **Validation**: Syntax checking and test running
- **Rollback**: Instant recovery if anything fails
- **Isolation**: High-risk changes run in isolated environments

### Feature Isolation
Run new features alongside existing code:
- No git branches needed
- Runtime switching
- A/B testing support
- Progressive rollout

## 📋 Workflow Examples

### Example 1: Safe Rename
```bash
# 1. Analyze impact
node tools/surgical-toolkit/impact-analyzer.js src/utils/oldHelper.js

# 2. If risk is low, proceed with rename
node tools/surgical-toolkit/safe-refactor.js rename oldHelper newHelper

# 3. Tests run automatically, rollback if they fail
```

### Example 2: Feature Development
```bash
# 1. Create isolated environment for new feature
node tools/surgical-toolkit/feature-isolator.js create new-ui src/components/App.jsx src/styles/app.css

# 2. Develop in isolation
# Edit src/components/App.new-ui.jsx and src/styles/app.new-ui.css

# 3. Test with ?feature=new-ui in browser

# 4. When ready, merge or rollback
node tools/surgical-toolkit/feature-isolator.js rollback new-ui
```

### Example 3: Complex Refactoring
```bash
# 1. Create surgical plan
cat > surgery-plan.json << EOF
{
  "description": "Refactor authentication system",
  "changes": [
    {
      "type": "RENAME",
      "oldName": "doAuth",
      "newName": "authenticate",
      "files": ["src/auth.js"]
    },
    {
      "type": "EXTRACT",
      "sourceFile": "src/auth.js",
      "startLine": 50,
      "endLine": 100,
      "targetFile": "src/utils/validation.js",
      "name": "validateCredentials"
    }
  ]
}
EOF

# 2. Execute with safety checks
node tools/surgical-toolkit/index.js execute surgery-plan.json
```

## 🔒 Safety Guarantees

1. **No Destructive Changes**: All original files are backed up
2. **Test Protection**: Changes roll back if tests fail
3. **Dependency Awareness**: Warns about breaking changes
4. **Git Safety**: Warns if working directory is dirty
5. **Syntax Validation**: Checks JavaScript/TypeScript syntax
6. **Progressive Rollout**: Test features on subset of users

## 📊 Reports and Logs

All operations generate detailed reports:
- **Impact Analysis**: `./impact-reports/`
- **Surgical Plans**: `./surgical-plans/`
- **Execution Logs**: `./surgical-logs/`
- **Backups**: `./surgical-backups/`
- **Feature Configs**: `./features/configs/`

## 🚀 Quick Start

```bash
# Make the tools executable
chmod +x tools/surgical-toolkit/*.js

# Run help for any tool
node tools/surgical-toolkit/index.js help

# Start with impact analysis
node tools/surgical-toolkit/impact-analyzer.js src/index.js

# Try a safe rename
node tools/surgical-toolkit/safe-refactor.js rename oldVar newVar
```

## ⚙️ Configuration

Create `.surgicalrc` for default settings:
```json
{
  "autoBackup": true,
  "runTests": true,
  "testPattern": "**/*.test.js",
  "excludeDirs": ["node_modules", ".git", "dist"],
  "maxRiskLevel": "HIGH",
  "requireCleanGit": true,
  "autoRollback": true
}
```

## 🎨 Best Practices

1. **Always run impact analysis first** - Understand the scope of changes
2. **Use feature isolation for risky changes** - Test in production safely
3. **Break large changes into smaller ones** - Easier to validate and rollback
4. **Keep tests passing** - The toolkit relies on tests for validation
5. **Commit before surgical changes** - Clean git state for easy recovery
6. **Review execution reports** - Learn from each operation

## 🔧 Troubleshooting

### "Pre-flight checks failed"
- Commit or stash your changes
- Fix failing tests
- Resolve linting issues

### "High risk level detected"
- Consider using feature isolation
- Break change into smaller parts
- Add more tests before proceeding

### "Rollback failed"
- Check `./surgical-backups/` for manual recovery
- Use git to revert if needed

## 📝 License

MIT - Use these tools to make your codebase better!

---

**Remember**: With great power comes great responsibility. These tools make it safe to refactor, but always review changes before deploying to production.