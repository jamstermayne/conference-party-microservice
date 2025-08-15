# NPM Scripts Reference 📦

## Token Management Scripts

### Checking & Validation
```bash
npm run lint:tokens        # Check for hardcoded px values (main linter)
npm run check:tokens       # Alias for lint:tokens  
npm run lint:css          # Alias for lint:tokens
npm run validate:tokens    # Comprehensive token validation
```

### Migration & Fixes
```bash
npm run migrate:tokens       # Preview what would be changed
npm run migrate:tokens:apply # Apply token migrations (with backup)
```

## Usage Examples

### Daily Development
```bash
# Before committing - check your CSS
npm run lint:tokens

# If violations found, see what needs fixing
npm run migrate:tokens

# Apply fixes automatically
npm run migrate:tokens:apply
```

### CI/CD Integration
The `lint:tokens` script is automatically run:
- On every commit (via pre-commit hook)
- On every PR (via GitHub Actions)
- Can be added to build pipeline

### Quick Reference

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `npm run lint:tokens` | Check for px violations | Before commits, in CI |
| `npm run migrate:tokens` | Preview migrations | When violations found |
| `npm run migrate:tokens:apply` | Fix violations | To clean up codebase |
| `npm run validate:tokens` | Full validation | Periodic health check |

## Script Details

All scripts use bash for consistency:
- Works in CI/CD environments
- Cross-platform compatible
- No need for executable permissions
- Consistent error handling

## Exit Codes

- `0` - All checks passed
- `1` - Violations found (blocks commits/CI)

## Configuration

Scripts read from:
- Token definitions: `frontend/src/assets/css/spacing-tokens.css`
- Allowed exceptions configured in: `scripts/check-tokens.sh`

## Adding to Your Workflow

### VS Code Tasks
Add to `.vscode/tasks.json`:
```json
{
  "label": "Check Tokens",
  "type": "npm",
  "script": "lint:tokens",
  "problemMatcher": []
}
```

### Git Hooks
Already configured in `.husky/pre-commit`

### GitHub Actions
Already configured in `.github/workflows/token-check.yml`