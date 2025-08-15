# Design Token System

## Single Source of Truth
`spacing-tokens.css` is the authoritative source for all design tokens in the application.

## Load Order
The token file MUST be loaded first in HTML:
```html
<!-- Design tokens: Single source of truth (load first) -->
<link rel="stylesheet" href="/assets/css/spacing-tokens.css">
<!-- Then theme and other styles -->
<link rel="stylesheet" href="/assets/css/theme.css">
```

## Token Reference

### Spacing Tokens (--s-*)
- `--s-1`: 0.25rem (4px)
- `--s-2`: 0.5rem (8px)
- `--s-3`: 0.75rem (12px)
- `--s-4`: 1rem (16px)
- `--s-5`: 1.25rem (20px)
- `--s-6`: 1.5rem (24px)
- `--s-8`: 2rem (32px)
- `--s-10`: 2.5rem (40px)
- `--s-12`: 3rem (48px)
- `--s-16`: 4rem (64px)

### Radius Tokens (--r-*)
- `--r-xs`: 0.125rem (2px) - tiny corners
- `--r-sm`: 0.25rem (4px) - small radius
- `--r-md`: 0.5rem (8px) - medium radius
- `--r-lg`: 0.75rem (12px) - large radius
- `--r-xl`: 1rem (16px) - extra large
- `--r-2xl`: 1.5rem (24px) - 2x large
- `--r-full`: 9999px - pill/circle shapes

### Shadow Tokens (--shadow-*)
- `--shadow-xs`: Minimal shadow
- `--shadow-sm`: Small shadow
- `--shadow-md`: Medium shadow
- `--shadow-lg`: Large shadow
- `--shadow-xl`: Extra large shadow
- `--shadow-2xl`: Maximum shadow
- `--shadow-card`: Card-specific shadow
- `--shadow-card-hover`: Card hover state

## Usage Examples

```css
/* Use tokens instead of hardcoded values */
.card {
  padding: var(--s-4);        /* Instead of: padding: 16px */
  margin-bottom: var(--s-6);  /* Instead of: margin-bottom: 24px */
  border-radius: var(--r-lg); /* Instead of: border-radius: 12px */
  box-shadow: var(--shadow-md);
}

.button {
  padding: var(--s-2) var(--s-4); /* 8px 16px */
  border-radius: var(--r-md);     /* 8px radius */
}

.pill {
  border-radius: var(--r-full);   /* Fully rounded */
}
```

## Migration Guide

When updating existing CSS:
1. Replace hardcoded pixel values with tokens
2. Use the closest token value (e.g., 14px → --s-4 (16px))
3. Keep the token system as the single source of truth
4. Never define spacing/radius values outside of `spacing-tokens.css`

## Benefits
- **Consistency**: All spacing follows a harmonious scale
- **Maintainability**: Change values in one place
- **Responsiveness**: Easy to adjust for different screen sizes
- **Theme-ability**: Tokens can be overridden for different themes
- **Performance**: CSS variables are optimized by browsers