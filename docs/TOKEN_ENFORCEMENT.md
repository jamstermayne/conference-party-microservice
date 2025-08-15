# Design Token Enforcement System 🛡️

Comprehensive guardrails to prevent hardcoded px values from creeping back into the codebase.

## Overview

This system enforces the use of design tokens across all CSS files through multiple layers:
- **Pre-commit hooks** - Catch violations before commit
- **CI/CD checks** - Block PRs with violations
- **Local linting** - IDE and command-line validation
- **Automated fixes** - Migration tools for bulk updates

## Quick Reference

### NPM Scripts
```bash
npm run check:tokens        # Check for hardcoded px values
npm run lint:css            # Alias for check:tokens
npm run validate:tokens     # Comprehensive token validation
npm run migrate:tokens      # Preview token migrations
npm run migrate:tokens:apply # Apply token migrations
```

### Token Mappings
| Pixel Value | Token Variable | Use Case |
|------------|---------------|----------|
| `4px` | `var(--s-1)` | Minimal spacing |
| `8px` | `var(--s-2)` | Tight spacing |
| `12px` | `var(--s-3)` | Small spacing |
| `16px` | `var(--s-4)` | Default spacing |
| `20px` | `var(--s-5)` | Medium spacing |
| `24px` | `var(--s-6)` | Large spacing |
| `32px` | `var(--s-7)` | Extra spacing |
| `40px` | `var(--s-8)` | Huge spacing |

| Border Radius | Token Variable | Use Case |
|--------------|---------------|----------|
| `2px` | `var(--r-xs)` | Minimal rounding |
| `4px` | `var(--r-sm)` | Small rounding |
| `8px` | `var(--r-md)` | Default rounding |
| `12px` | `var(--r-lg)` | Large rounding |
| `16px` | `var(--r-xl)` | Extra rounding |
| `24px` | `var(--r-2xl)` | Huge rounding |
| `50%/999px` | `var(--r-full)` | Full circle/pill |

## Components

### 1. Token Check Script (`scripts/check-tokens.sh`)
Core enforcement script that:
- Scans all CSS files for hardcoded px values
- Provides specific token replacement suggestions
- Allows exceptions for legitimate cases (1px borders, calc(), etc.)
- Returns exit code 1 if violations found (blocks commits/CI)

**Allowed Exceptions:**
- `border: 1px` - Hairline borders
- `outline: 1px` - Focus outlines
- `box-shadow` - Complex shadow values
- `calc()` expressions
- `@media` queries
- Animation/transition values

### 2. Pre-commit Hook (`.husky/pre-commit`)
Runs automatically before every commit:
```bash
#!/usr/bin/env sh
./scripts/check-tokens.sh
```

To bypass in emergencies: `git commit --no-verify`

### 3. GitHub Actions CI (`.github/workflows/token-check.yml`)
Runs on every PR that touches CSS files:
- Validates token usage
- Checks token definitions exist
- Verifies tokens are loaded in HTML
- Comments on PR with violations and suggestions

### 4. Stylelint Configuration (`.stylelintrc.json`)
IDE integration for real-time feedback:
- Warns on hardcoded px values
- Enforces token usage for spacing/sizing properties
- Integrates with VS Code, WebStorm, etc.

### 5. Comprehensive Linting (`scripts/lint-tokens.sh`)
Full validation suite that checks:
1. Hardcoded px values
2. Token definitions exist
3. Token usage consistency
4. Undefined token usage
5. HTML loads token CSS

## Usage

### For Developers

#### Before Committing
```bash
# Check your changes
npm run check:tokens

# If violations found, see what needs fixing
npm run migrate:tokens

# Apply fixes automatically
npm run migrate:tokens:apply

# Verify everything is good
npm run validate:tokens
```

#### IDE Setup
1. Install Stylelint extension for your IDE
2. It will automatically highlight violations
3. Hover for replacement suggestions

### For CI/CD

The GitHub Actions workflow runs automatically on:
- Pull requests touching CSS files
- Pushes to main/develop branches

Failed checks will:
- Block PR merging
- Add comment with specific violations
- Provide token reference guide

### For Code Reviews

Look for:
- ✅ All spacing uses `var(--s-*)` tokens
- ✅ All radius uses `var(--r-*)` tokens
- ✅ Consistent token usage across components
- ⚠️ Any `/* stylelint-disable */` comments (need justification)

## Migration

### Migrating Existing Code
```bash
# See what would change
npm run migrate:tokens

# Apply changes (with backup)
npm run migrate:tokens:apply

# Rollback if needed
./tools/migrate-to-tokens.sh rollback
```

### Adding New Tokens

1. Add to `frontend/src/assets/css/spacing-tokens.css`:
```css
:root {
  --s-9: 3.5rem;  /* 56px - New size */
}
```

2. Update enforcement scripts if needed
3. Document in this file

## Exceptions

### Valid Use Cases for px

Some legitimate uses of px values:
- **1px borders** - For hairlines and dividers
- **Box shadows** - Complex shadow definitions
- **Media queries** - Breakpoint definitions
- **Calc expressions** - Mathematical calculations
- **SVG/Canvas** - Precise positioning
- **Animation keyframes** - Frame-specific values

### Disabling Checks

For legitimate exceptions:

```css
/* Token check: ignore - SVG positioning requires exact px */
.icon-sprite {
  background-position: -24px -48px;
}
```

Or for Stylelint:
```css
/* stylelint-disable-next-line scale-unlimited/declaration-strict-value */
width: 37px; /* Specific icon dimension */
```

## Troubleshooting

### "Use tokens instead of hardcoded px"
- Run `npm run check:tokens` to see specific violations
- Each violation shows the suggested token replacement
- Use `npm run migrate:tokens:apply` for automatic fixes

### "Token not defined"
- Check token exists in `spacing-tokens.css`
- Ensure you're using the correct token name
- Run `npm run validate:tokens` to check all tokens

### Pre-commit hook failing
- The hook prevents commits with token violations
- Fix violations or use `--no-verify` flag (emergency only)
- Run `npm run lint:css` to see what's wrong

### CI failing on PR
- Check the GitHub Actions log for specific violations
- The bot comment on your PR has replacement suggestions
- Fix locally and push updates

## Best Practices

1. **Always use tokens for spacing/sizing**
   - Even for one-off values, use the closest token
   - If no suitable token exists, propose adding one

2. **Review token usage in PRs**
   - Check for consistency across components
   - Ensure similar elements use similar spacing

3. **Document exceptions**
   - Add comments explaining why px is needed
   - Reference the specific use case

4. **Keep tokens organized**
   - Group related tokens together
   - Use consistent naming patterns
   - Document token purposes

## Future Enhancements

Planned improvements:
- [ ] Auto-fix in IDE save
- [ ] Custom VS Code snippets for tokens
- [ ] Token usage analytics dashboard
- [ ] Automated token optimization
- [ ] Theme-specific token sets

## Resources

- [Design Tokens Spec](https://www.w3.org/community/design-tokens/)
- [Token Best Practices](https://css-tricks.com/what-are-design-tokens/)
- Project token definitions: `/frontend/src/assets/css/spacing-tokens.css`
- Migration tools: `/tools/migrate-to-tokens.sh`

## Support

For questions or issues:
1. Check this documentation
2. Run `npm run validate:tokens` for diagnostics
3. Ask in #frontend-dev channel
4. File issue with `design-tokens` label