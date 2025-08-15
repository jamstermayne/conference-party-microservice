# Color Token System

This directory contains the definitive color token system for the application.

## Files

- **color-tokens.css** - The single source of truth for all colors
- **color-compat.css** - Backward compatibility aliases for legacy token names

## Token Structure

### Brand Colors (--brand-*)
- 50-900 scale from lightest to darkest
- --brand-500 is the core brand color

### Neutral Colors (--neutral-*)
- 0-900 scale for UI surfaces and text
- Lower numbers = darker (for dark theme)
- Higher numbers = lighter

### Semantic Tokens
- **Text**: --text-primary, --text-secondary, --text-muted
- **Surfaces**: --bg-body, --bg-card, --bg-elevated
- **Borders**: --border-primary, --border-muted
- **Accents**: --accent, --accent-hover, --accent-weak
- **States**: --success, --warning, --error, --info (with -weak variants)

## Theme Support

The system supports theme switching via `data-theme` attribute on `<html>`:

```html
<html data-theme="dark">  <!-- Dark theme (default) -->
<html data-theme="light"> <!-- Light theme -->
```

## Usage Guidelines

1. **Always use semantic tokens** for common use cases (text, backgrounds, borders)
2. **Use brand/neutral scales** only when semantic tokens don't fit
3. **Never use hex colors directly** in CSS - always use tokens
4. **For new colors**, add them to the token system first

## Migration

If you're updating from the old system:
- Old token names are mapped in color-compat.css
- Gradually migrate to new token names
- Remove color-compat.css once migration is complete