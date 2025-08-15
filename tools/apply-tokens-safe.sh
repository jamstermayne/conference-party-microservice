#!/bin/bash
# Safe token migration with automatic backup and validation
# Usage: ./apply-tokens-safe.sh

set -euo pipefail

echo "🚀 Safe Token Migration Tool"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Create timestamped backup
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="tools/backups/token-migration-$TIMESTAMP"

echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"

# Backup all CSS files
find frontend/src -name "*.css" -exec cp --parents {} "$BACKUP_DIR/" \;

echo "✅ Backup created: $BACKUP_DIR"
echo

# Run preview first
echo "📊 Preview of changes:"
./tools/migrate-to-tokens.sh preview | tail -5
echo

# Ask for confirmation
read -p "Apply these changes? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Migration cancelled"
    exit 1
fi

echo
echo "🔄 Applying token migrations..."
./tools/migrate-to-tokens.sh apply

echo
echo "✅ Migration complete!"
echo
echo "📋 Post-migration checklist:"
echo "  1. Review changes: git diff frontend/src"
echo "  2. Test locally: npm run dev"
echo "  3. Run build: npm run build"
echo "  4. Commit changes: git add -A && git commit -m 'refactor(css): migrate px values to design tokens'"
echo "  5. Deploy: npm run deploy"
echo
echo "🔙 To rollback: ./tools/migrate-to-tokens.sh rollback"
echo "   Or restore from: $BACKUP_DIR"