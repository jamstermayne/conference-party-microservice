#!/bin/bash

# Performance Optimization Script
# Removes conflicting code and optimizes for performance

echo "⚡ Starting performance optimization..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Backup directory
BACKUP_DIR="tools/performance-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📁 Backup directory: $BACKUP_DIR${NC}"

# 1. Remove duplicate router implementations
echo -e "\n${CYAN}1. Removing duplicate router files...${NC}"
ROUTER_FILES_TO_REMOVE=(
  "frontend/src/assets/js/home-router-hotfix.js"
  "frontend/src/assets/js/router-lite-v2.js"
  "frontend/src/assets/js/router-stack.js"
  "frontend/src/assets/js/router-route-metrics.js"
  "frontend/src/dist/js/router-stack.js"
  "frontend/src/js/router-stack-enhanced.js"
  "frontend/src/js/example-router-usage.js"
  "frontend/src/js/router-stack.js"
)

for file in "${ROUTER_FILES_TO_REMOVE[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    rm "$file"
    echo -e "${RED}✗ Removed: $file${NC}"
  fi
done

# Keep only the stub router
echo -e "${GREEN}✓ Kept: frontend/src/assets/js/router-2panel-lite.js (stub only)${NC}"

# 2. Check for duplicate event listeners on document/window
echo -e "\n${CYAN}2. Checking for global event listener conflicts...${NC}"
echo "Document listeners:"
grep -r "document.addEventListener" frontend/src/assets/js --include="*.js" | wc -l
echo "Window listeners:"
grep -r "window.addEventListener" frontend/src/assets/js --include="*.js" | wc -l

# 3. Find and remove minified versions (we'll use non-minified in dev)
echo -e "\n${CYAN}3. Removing unnecessary minified files...${NC}"
find frontend/src -name "*.min.js" -o -name "*.min.css" | while read file; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    rm "$file"
    echo -e "${RED}✗ Removed minified: $(basename $file)${NC}"
  fi
done

# 4. Check for large files that might slow loading
echo -e "\n${CYAN}4. Checking for large files (>100KB)...${NC}"
find frontend/src -type f \( -name "*.js" -o -name "*.css" \) -size +100k -exec ls -lh {} \; 2>/dev/null

# 5. Find unused event listeners
echo -e "\n${CYAN}5. Analyzing event listeners for memory leaks...${NC}"
echo "Files with multiple click listeners (potential memory leaks):"
grep -r "addEventListener('click'" frontend/src/assets/js --include="*.js" | cut -d: -f1 | uniq -c | sort -rn | head -5

# 6. Check for setTimeout/setInterval without cleanup
echo -e "\n${CYAN}6. Checking for timer leaks...${NC}"
echo "setInterval usage (needs cleanup):"
grep -r "setInterval" frontend/src/assets/js --include="*.js" | grep -v "clearInterval" | wc -l
echo "setTimeout usage:"
grep -r "setTimeout" frontend/src/assets/js --include="*.js" | wc -l

# 7. Remove test files from production
echo -e "\n${CYAN}7. Removing test files from production...${NC}"
TEST_FILES=(
  "frontend/src/demo-cards.html"
  "test-2column.html"
)

for file in "${TEST_FILES[@]}"; do
  if [ -f "$file" ]; then
    cp "$file" "$BACKUP_DIR/$(basename $file)"
    rm "$file"
    echo -e "${RED}✗ Removed test file: $file${NC}"
  fi
done

# 8. Optimize CSS by removing unused rules
echo -e "\n${CYAN}8. CSS optimization analysis...${NC}"
CSS_FILES_IN_USE=(
  "frontend/src/assets/css/tokens.css"
  "frontend/src/assets/css/home.css"
  "frontend/src/assets/css/cards-modern.css"
  "frontend/src/assets/css/panels-2panel.css"
)

total_css_size=0
for css in "${CSS_FILES_IN_USE[@]}"; do
  if [ -f "$css" ]; then
    size=$(wc -c < "$css")
    total_css_size=$((total_css_size + size))
    echo -e "  $(basename $css): $(du -h $css | cut -f1)"
  fi
done
echo -e "${GREEN}Total CSS size: $(echo $total_css_size | numfmt --to=iec-i --suffix=B)${NC}"

# 9. Create optimized loading order
echo -e "\n${CYAN}9. Optimal script loading order:${NC}"
cat << 'EOF'
<!-- Critical CSS (inline in production) -->
<link rel="stylesheet" href="/assets/css/tokens.css">
<link rel="stylesheet" href="/assets/css/home.css">

<!-- Deferred CSS -->
<link rel="preload" href="/assets/css/cards-modern.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" href="/assets/css/panels-2panel.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

<!-- Core modules (keep defer for non-blocking) -->
<script type="module" defer src="/assets/js/api-lite.js"></script>
<script type="module" defer src="/assets/js/calendar-lite.js"></script>
<script type="module" defer src="/assets/js/parties-data.js"></script>

<!-- UI modules (keep defer) -->
<script type="module" defer src="/assets/js/cards-lite.js"></script>
<script type="module" defer src="/assets/js/overlay-2panel.js"></script>
<script type="module" defer src="/assets/js/home-pills-monfri.js"></script>
<script type="module" defer src="/assets/js/home-wire-channels.js"></script>
EOF

# 10. Performance recommendations
echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}⚡ Performance Optimization Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"

# Count what we removed
removed_count=$(ls -1 $BACKUP_DIR 2>/dev/null | wc -l)
echo -e "Files removed: ${RED}$removed_count${NC}"
echo -e "Backup location: ${YELLOW}$BACKUP_DIR${NC}"

echo -e "\n${CYAN}📊 Performance Recommendations:${NC}"
echo "1. ✅ Removed duplicate router implementations"
echo "2. ✅ Removed unnecessary minified files"
echo "3. ✅ Removed test files from production"
echo "4. ⚠️  Consider lazy-loading cards-modern.css and panels-2panel.css"
echo "5. ⚠️  Add cleanup for any setInterval calls"
echo "6. ⚠️  Consider bundling modules for production"

# Check final bundle size
echo -e "\n${CYAN}📦 Final asset sizes:${NC}"
total_js_size=0
for js in frontend/src/assets/js/*.js; do
  if [[ -f "$js" && ! "$js" == *".min.js" ]]; then
    size=$(wc -c < "$js" 2>/dev/null || echo 0)
    total_js_size=$((total_js_size + size))
  fi
done
echo -e "Total JS: ${GREEN}$(echo $total_js_size | numfmt --to=iec-i --suffix=B)${NC}"
echo -e "Total CSS: ${GREEN}$(echo $total_css_size | numfmt --to=iec-i --suffix=B)${NC}"