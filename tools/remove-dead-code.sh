#!/bin/bash

# Dead Code Removal Script for Conference Party App
# Removes unused CSS, JS files and cleans up the codebase

echo "🧹 Starting dead code removal audit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track what we're removing
REMOVED_COUNT=0
KEPT_COUNT=0

# Create backup directory
BACKUP_DIR="tools/dead-code-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Backup directory: $BACKUP_DIR${NC}"

# List of CSS files that are ACTUALLY used (from index.html)
USED_CSS=(
  "frontend/src/assets/css/tokens.css"
  "frontend/src/assets/css/home.css"
  "frontend/src/assets/css/cards-modern.css"
  "frontend/src/assets/css/panels-2panel.css"
)

# List of JS files that are ACTUALLY used (from index.html)
USED_JS=(
  "frontend/src/assets/js/api-lite.js"
  "frontend/src/assets/js/calendar-lite.js"
  "frontend/src/assets/js/invites-lite.js"
  "frontend/src/assets/js/cards-lite.js"
  "frontend/src/assets/js/home-pills-monfri.js"
  "frontend/src/assets/js/router-2panel-lite.js"
  "frontend/src/assets/js/parties-data.js"
  "frontend/src/assets/js/overlay-2panel.js"
  "frontend/src/assets/js/home-wire-channels.js"
  "frontend/src/assets/js/home-cards-init.js"
  "frontend/src/assets/js/cards-modern.js"  # Used by cards-lite.js
  "frontend/src/assets/js/parties-index.js"  # May be imported
)

# Dead CSS files to remove
DEAD_CSS=(
  "frontend/src/assets/css/cards-final.css"
  "frontend/src/assets/css/cards-hero.css"
  "frontend/src/assets/css/cards-parties.css"
  "frontend/src/assets/css/cards.css"
  "frontend/src/assets/css/components/cards.css"
  "frontend/src/assets/css/event-cards.css"
  "frontend/src/assets/css/events-cards.css"
  "frontend/src/assets/css/hero-cards.css"
  "frontend/src/assets/css/party-cards.css"
  "frontend/src/css/cards-parties.css"
  "frontend/src/css/cards.css"
  "frontend/src/css/events-cards.css"
  "frontend/src/css/events.css"
)

# Dead JS files to remove
DEAD_JS=(
  "frontend/src/assets/js/ui/eventCard.js"
  "frontend/src/js/party-card.js"
  "frontend/src/js/party-cards.js"
  "frontend/src/js/ui-card.js"
  "frontend/src/js/ui-cards.js"
  "frontend/src/js/components/cards.js"
  "frontend/src/js/ui/equalize-cards.js"
  "frontend/src/js/ui/partyCard.js"
  "frontend/src/js/event-list-integration.js"
  "frontend/src/js/event-manager.js"
  "frontend/src/js/events-empty-state.js"
  "frontend/src/js/render-events.js"
  # Legacy router files
  "frontend/src/assets/js/router-2panel-mvp.js"
  "frontend/src/assets/js/router-2panel-mvp.min.js"
  "frontend/src/assets/js/router-2panel-lite.min.js"
  "frontend/src/assets/js/channel-widths.js"
)

# Function to backup and remove file
remove_file() {
  local file="$1"
  if [ -f "$file" ]; then
    # Create backup
    cp "$file" "$BACKUP_DIR/$(basename $file).bak"
    rm "$file"
    echo -e "${RED}✗ Removed: $file${NC}"
    ((REMOVED_COUNT++))
  fi
}

# Function to check if file is imported anywhere
check_imports() {
  local file="$1"
  local basename=$(basename "$file" .js)
  local imports=$(grep -r "import.*$basename" frontend/src --include="*.js" --include="*.html" 2>/dev/null | wc -l)
  return $imports
}

echo -e "\n${YELLOW}🗑️  Removing dead CSS files...${NC}"
for css in "${DEAD_CSS[@]}"; do
  remove_file "$css"
done

echo -e "\n${YELLOW}🗑️  Removing dead JavaScript files...${NC}"
for js in "${DEAD_JS[@]}"; do
  # Check if it's imported anywhere
  check_imports "$js"
  if [ $? -eq 0 ]; then
    remove_file "$js"
  else
    echo -e "${GREEN}✓ Kept (imported): $js${NC}"
    ((KEPT_COUNT++))
  fi
done

# Remove empty directories
echo -e "\n${YELLOW}📁 Cleaning empty directories...${NC}"
find frontend/src -type d -empty -delete 2>/dev/null

# Check for duplicate router implementations
echo -e "\n${YELLOW}🔍 Checking for router conflicts...${NC}"
ROUTER_FILES=$(find frontend/src -name "*router*.js" -type f 2>/dev/null)
if [ ! -z "$ROUTER_FILES" ]; then
  echo "Found router files:"
  echo "$ROUTER_FILES"
fi

# Check for multiple event listeners on same elements
echo -e "\n${YELLOW}🔍 Checking for duplicate event listeners...${NC}"
grep -r "addEventListener" frontend/src/assets/js --include="*.js" | grep -E "(click|scroll|load)" | sort | uniq -c | sort -rn | head -10

# Summary
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Dead Code Removal Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "Files removed: ${RED}$REMOVED_COUNT${NC}"
echo -e "Files kept: ${GREEN}$KEPT_COUNT${NC}"
echo -e "Backup location: ${YELLOW}$BACKUP_DIR${NC}"

# Size comparison
if [ $REMOVED_COUNT -gt 0 ]; then
  BACKUP_SIZE=$(du -sh "$BACKUP_DIR" 2>/dev/null | cut -f1)
  echo -e "Space saved: ${GREEN}~$BACKUP_SIZE${NC}"
fi

echo -e "\n💡 To restore files: ${YELLOW}cp $BACKUP_DIR/*.bak frontend/src/...${NC}"