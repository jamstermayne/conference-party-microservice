#!/bin/bash
# Safe, fast migration script to convert px values to design tokens
# Usage: ./migrate-to-tokens.sh [preview|apply|rollback]

set -euo pipefail

MODE="${1:-preview}"
BACKUP_DIR="tools/token-migration-backup-$(date +%Y%m%d-%H%M%S)"
MIGRATION_LOG="tools/token-migration.log"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Complete token mapping based on spacing-tokens.css
declare -A SPACING_MAP=(
    ["0px"]="0"
    ["2px"]="var(--s-0-5)"
    ["4px"]="var(--s-1)"
    ["6px"]="var(--s-1-5)"
    ["8px"]="var(--s-2)"
    ["10px"]="var(--s-2-5)"
    ["12px"]="var(--s-3)"
    ["14px"]="var(--s-3-5)"
    ["16px"]="var(--s-4)"
    ["20px"]="var(--s-5)"
    ["24px"]="var(--s-6)"
    ["28px"]="var(--s-7)"
    ["32px"]="var(--s-8)"
    ["36px"]="var(--s-9)"
    ["40px"]="var(--s-10)"
    ["44px"]="var(--s-11)"
    ["48px"]="var(--s-12)"
    ["56px"]="var(--s-13)"
    ["64px"]="var(--s-14)"
    ["72px"]="var(--s-15)"
    ["80px"]="var(--s-16)"
    ["96px"]="var(--s-20)"
    ["128px"]="var(--s-24)"
    ["160px"]="var(--s-28)"
    ["192px"]="var(--s-32)"
    ["224px"]="var(--s-36)"
    ["256px"]="var(--s-40)"
)

declare -A RADIUS_MAP=(
    ["2px"]="var(--r-xs)"
    ["3px"]="var(--r-xs)"
    ["4px"]="var(--r-sm)"
    ["6px"]="var(--r-sm)"
    ["8px"]="var(--r-md)"
    ["12px"]="var(--r-lg)"
    ["16px"]="var(--r-xl)"
    ["24px"]="var(--r-2xl)"
    ["9999px"]="var(--r-pill)"
    ["999px"]="var(--r-pill)"
)

# Comprehensive file list from audit (excluding token files)
CSS_FILES=(
    "frontend/src/assets/css/account.css"
    "frontend/src/assets/css/animations.css"
    "frontend/src/assets/css/app-shell.css"
    "frontend/src/assets/css/button-secondary.css"
    "frontend/src/assets/css/calendar-button-single.css"
    "frontend/src/assets/css/calendar-buttons.css"
    "frontend/src/assets/css/calendar-fit.css"
    "frontend/src/assets/css/calendar-modal.css"
    "frontend/src/assets/css/calendar-uniform.css"
    "frontend/src/assets/css/calendar.css"
    "frontend/src/assets/css/cards-hero.css"
    "frontend/src/assets/css/cards-parties.css"
    "frontend/src/assets/css/cards.css"
    "frontend/src/assets/css/contacts-permission.css"
    "frontend/src/assets/css/day-subnav.css"
    "frontend/src/assets/css/email-sync-popup.css"
    "frontend/src/assets/css/emailSyncPrompt.css"
    "frontend/src/assets/css/event-cards.css"
    "frontend/src/assets/css/events-cards.css"
    "frontend/src/assets/css/events-ftue.css"
    "frontend/src/assets/css/events.css"
    "frontend/src/assets/css/header-actions.css"
    "frontend/src/assets/css/hero-cards.css"
    "frontend/src/assets/css/hotspots.css"
    "frontend/src/assets/css/install.css"
    "frontend/src/assets/css/invites.css"
    "frontend/src/assets/css/layout.css"
    "frontend/src/assets/css/main.css"
    "frontend/src/assets/css/nav.css"
    "frontend/src/assets/css/party-cards.css"
    "frontend/src/assets/css/pin-button.css"
    "frontend/src/assets/css/sidebar-final.css"
    "frontend/src/assets/css/sidebar-minimal.css"
    "frontend/src/assets/css/sidebar-modern.css"
    "frontend/src/assets/css/sidebar-rail.css"
    "frontend/src/assets/css/sidebar-subnav.css"
    "frontend/src/assets/css/sidebar-velocity.css"
    "frontend/src/assets/css/sidebar.css"
    "frontend/src/assets/css/slot-heights.css"
    "frontend/src/assets/css/styles.css"
    "frontend/src/assets/css/theme-unified.css"
    "frontend/src/assets/css/theme.css"
    "frontend/src/assets/css/toast.css"
    "frontend/src/assets/css/z-overrides.css"
)

preview_changes() {
    echo -e "${BLUE}=== Token Migration Preview ===${NC}"
    echo -e "${YELLOW}Finding px values that should be tokens...${NC}\n"
    
    local total_changes=0
    
    for file in "${CSS_FILES[@]}"; do
        if [[ ! -f "$file" ]]; then
            continue
        fi
        
        local file_changes=0
        echo -e "${GREEN}📄 $file${NC}"
        
        # Check for spacing values
        for px in "${!SPACING_MAP[@]}"; do
            local token="${SPACING_MAP[$px]}"
            local count=$(grep -c "[[:space:]]${px}" "$file" 2>/dev/null || true)
            if [[ $count -gt 0 ]]; then
                echo "   ${px} → ${token} (${count} occurrences)"
                ((file_changes+=count))
            fi
        done
        
        # Check for border-radius values
        for px in "${!RADIUS_MAP[@]}"; do
            local token="${RADIUS_MAP[$px]}"
            local count=$(grep -c "border-radius:.*${px}" "$file" 2>/dev/null || true)
            if [[ $count -gt 0 ]]; then
                echo "   border-radius: ${px} → ${token} (${count} occurrences)"
                ((file_changes+=count))
            fi
        done
        
        if [[ $file_changes -eq 0 ]]; then
            echo "   ✓ Already using tokens"
        else
            echo "   Total: ${file_changes} changes needed"
            ((total_changes+=file_changes))
        fi
        echo
    done
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}Total changes needed: ${total_changes}${NC}"
    echo -e "\nRun ${GREEN}$0 apply${NC} to apply these changes"
    echo -e "Run ${YELLOW}$0 rollback${NC} to restore from backup"
}

apply_changes() {
    echo -e "${BLUE}=== Applying Token Migration ===${NC}"
    
    # Create backup
    mkdir -p "$BACKUP_DIR"
    echo -e "${YELLOW}Creating backup in $BACKUP_DIR...${NC}"
    
    for file in "${CSS_FILES[@]}"; do
        if [[ -f "$file" ]]; then
            cp "$file" "$BACKUP_DIR/$(basename $file)"
        fi
    done
    
    echo -e "${GREEN}Backup created successfully${NC}\n"
    
    # Apply migrations
    local total_changes=0
    
    for file in "${CSS_FILES[@]}"; do
        if [[ ! -f "$file" ]]; then
            continue
        fi
        
        echo -e "${GREEN}Processing $file...${NC}"
        local file_changes=0
        
        # Create temp file
        local temp_file="${file}.tmp"
        cp "$file" "$temp_file"
        
        # Apply spacing tokens
        for px in "${!SPACING_MAP[@]}"; do
            local token="${SPACING_MAP[$px]}"
            # Match spacing values with word boundary or specific CSS contexts
            sed -i "s/\\([[:space:]]\\)${px}/\\1${token}/g" "$temp_file"
            sed -i "s/: ${px}/: ${token}/g" "$temp_file"
            sed -i "s/(${px}/(${token}/g" "$temp_file"
        done
        
        # Apply radius tokens
        for px in "${!RADIUS_MAP[@]}"; do
            local token="${RADIUS_MAP[$px]}"
            sed -i "s/border-radius:[[:space:]]*${px}/border-radius: ${token}/g" "$temp_file"
        done
        
        # Count changes
        if ! diff -q "$file" "$temp_file" > /dev/null; then
            local changes=$(diff "$file" "$temp_file" | grep -c "^<" || true)
            echo "   Applied ${changes} changes"
            ((total_changes+=changes))
            mv "$temp_file" "$file"
        else
            echo "   No changes needed"
            rm "$temp_file"
        fi
    done
    
    # Log migration
    echo "$(date): Applied ${total_changes} token migrations" >> "$MIGRATION_LOG"
    
    echo -e "\n${GREEN}✓ Migration complete!${NC}"
    echo -e "Total changes: ${total_changes}"
    echo -e "Backup saved to: ${BACKUP_DIR}"
    echo -e "\nTo rollback: ${YELLOW}$0 rollback${NC}"
}

rollback_changes() {
    echo -e "${BLUE}=== Rolling Back Token Migration ===${NC}"
    
    # Find most recent backup
    local latest_backup=$(ls -d tools/token-migration-backup-* 2>/dev/null | tail -1)
    
    if [[ -z "$latest_backup" ]]; then
        echo -e "${RED}Error: No backup found${NC}"
        exit 1
    fi
    
    echo -e "${YELLOW}Restoring from $latest_backup...${NC}"
    
    for file in "${CSS_FILES[@]}"; do
        local backup_file="$latest_backup/$(basename $file)"
        if [[ -f "$backup_file" ]]; then
            cp "$backup_file" "$file"
            echo "   Restored $file"
        fi
    done
    
    echo -e "${GREEN}✓ Rollback complete!${NC}"
}

# Main execution
case "$MODE" in
    preview)
        preview_changes
        ;;
    apply)
        apply_changes
        ;;
    rollback)
        rollback_changes
        ;;
    *)
        echo -e "${RED}Usage: $0 [preview|apply|rollback]${NC}"
        echo "  preview  - Show what changes would be made"
        echo "  apply    - Apply token migrations (with backup)"
        echo "  rollback - Restore from latest backup"
        exit 1
        ;;
esac