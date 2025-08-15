# Token Migration Tools 🎨

Safe, fast migration scripts to convert hardcoded px values to design tokens.

## Quick Start

```bash
# 1. Preview what will change
./tools/migrate-to-tokens.sh preview

# 2. Apply changes (with automatic backup)
./tools/apply-tokens-safe.sh

# 3. Validate tokens are working
./tools/validate-tokens.sh

# 4. If needed, rollback
./tools/migrate-to-tokens.sh rollback
```

## Tools Overview

### 🔍 `migrate-to-tokens.sh`
Main migration script with three modes:
- **preview**: Shows all px values that will be converted
- **apply**: Applies migrations with automatic backup
- **rollback**: Restores from most recent backup

**Token Mappings:**
- `4px` → `var(--s-1)`
- `8px` → `var(--s-2)`
- `12px` → `var(--s-3)`
- `16px` → `var(--s-4)`
- `20px` → `var(--s-5)`
- `24px` → `var(--s-6)`
- `32px` → `var(--s-7)`
- `40px` → `var(--s-8)`
- `48px` → `var(--s-10)`

**Radius Mappings:**
- `2px` → `var(--r-xs)`
- `4px` → `var(--r-sm)`
- `8px` → `var(--r-md)`
- `12px` → `var(--r-lg)`
- `16px` → `var(--r-xl)`
- `24px` → `var(--r-2xl)`
- `50%`, `999px`, `9999px` → `var(--r-full)`

### 🚀 `apply-tokens-safe.sh`
User-friendly wrapper that:
1. Creates timestamped backup
2. Shows preview
3. Asks for confirmation
4. Applies changes
5. Provides post-migration checklist

### 📊 `token-analysis.sh`
Advanced analysis tool that finds:
- Shorthand properties with multiple px values
- calc() expressions with px
- box-shadow properties
- Negative px values
- line-height/font-size with px
- Small fixed dimensions (icons)
- Animation durations
- Unique px value frequency

### ✅ `validate-tokens.sh`
Validation tool that checks:
- spacing-tokens.css is loaded in HTML
- Token usage summary
- Undefined tokens
- Remaining hardcoded values

## Migration Stats

Current status (as of migration):
- **210 changes** identified across 12 CSS files
- **66 spacing tokens** in use
- **79 radius tokens** in use
- **73 shadow tokens** in use
- All tokens properly defined in `/frontend/src/assets/css/spacing-tokens.css`

## File Coverage

Files processed by migration:
- `frontend/src/css/settings.css`
- `frontend/src/css/account.css`
- `frontend/src/css/ftue-nudge.css`
- `frontend/src/css/layout-polish.css`
- `frontend/src/css/events-cards.css`
- `frontend/src/css/hotspots.css`
- `frontend/src/assets/css/main.css`
- `frontend/src/assets/css/calendar-buttons.css`
- `frontend/src/assets/css/button-secondary.css`
- `frontend/src/assets/css/sidebar-subnav.css`
- `frontend/src/assets/css/z-overrides.css`
- `frontend/src/assets/css/pin-button.css`

## Post-Migration Workflow

1. **Review changes**: `git diff frontend/src`
2. **Test locally**: `npm run dev`
3. **Run build**: `npm run build`
4. **Commit**: `git add -A && git commit -m 'refactor(css): migrate px values to design tokens'`
5. **Deploy**: `npm run deploy`

## Manual Cases

Some patterns need manual review:
- **Shorthand with mixed values**: `padding: 10px 12px` → `padding: var(--s-2) var(--s-3)`
- **calc() expressions**: `calc(100vw - 16px)` → `calc(100vw - var(--s-4))`
- **box-shadow**: Consider using shadow tokens
- **Negative values**: `-8px` → `calc(var(--s-2) * -1)`

## Benefits

✨ **Consistency**: Single source of truth for spacing/radius
🎯 **Maintainability**: Change values in one place
📐 **Scalability**: Easy to add new sizes
🌈 **Theming**: Support for multiple themes
♿ **Accessibility**: Consistent touch targets

## Rollback

If issues occur after migration:
```bash
# Option 1: Use built-in rollback
./tools/migrate-to-tokens.sh rollback

# Option 2: Restore from specific backup
cp -r tools/backups/token-migration-TIMESTAMP/* frontend/src/
```

## Support

The token system is defined in:
- `/frontend/src/assets/css/spacing-tokens.css` - Token definitions
- `/frontend/src/index.html` - Token CSS import

For questions, check the design token documentation or run the analysis tools.