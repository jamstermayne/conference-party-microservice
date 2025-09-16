#!/bin/bash

# Module Build Orchestration Script
# Builds all modules independently with parallel execution and optimization

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
MODULES_DIR="$ROOT_DIR/frontend/src/modules"
BUILD_OUTPUT="$ROOT_DIR/dist/modules"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏗️  Module Build Orchestration System${NC}"
echo -e "${BLUE}======================================${NC}"

# Clean previous builds
echo -e "${YELLOW}📦 Cleaning previous builds...${NC}"
rm -rf "$BUILD_OUTPUT"
mkdir -p "$BUILD_OUTPUT"

# Available modules
MODULES=("auth" "events" "matchmaking" "calendar" "map")
TOTAL_MODULES=${#MODULES[@]}

echo -e "${BLUE}📋 Found $TOTAL_MODULES modules to build${NC}"

# Function to build a single module
build_module() {
    local module=$1
    local module_dir="$MODULES_DIR/$module"
    local start_time=$(date +%s%N)

    if [ ! -d "$module_dir" ]; then
        echo -e "${RED}❌ Module $module directory not found${NC}"
        return 1
    fi

    if [ ! -f "$module_dir/vite.config.js" ]; then
        echo -e "${RED}❌ Module $module missing vite.config.js${NC}"
        return 1
    fi

    echo -e "${YELLOW}🔨 Building $module module...${NC}"

    cd "$module_dir"

    # Install dependencies if needed
    if [ -f "package.json" ]; then
        npm install --silent
    fi

    # Build the module
    if npx vite build --config vite.config.js; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        echo -e "${GREEN}✅ Module $module built successfully (${duration}ms)${NC}"

        # Copy to central build output
        if [ -d "dist" ]; then
            mkdir -p "$BUILD_OUTPUT/$module"
            cp -r dist/* "$BUILD_OUTPUT/$module/"

            # Generate module manifest
            cat > "$BUILD_OUTPUT/$module/manifest.json" << EOF
{
  "name": "$module",
  "version": "1.0.0",
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "size": "$(du -sh "$BUILD_OUTPUT/$module" | cut -f1)",
  "files": $(find "$BUILD_OUTPUT/$module" -type f -name "*.js" | wc -l),
  "entry": "${module}-module.js"
}
EOF
        fi

        return 0
    else
        echo -e "${RED}❌ Module $module build failed${NC}"
        return 1
    fi
}

# Function to build modules in parallel
build_modules_parallel() {
    local pids=()
    local results=()

    echo -e "${BLUE}🚀 Starting parallel build process...${NC}"

    # Start builds in parallel
    for module in "${MODULES[@]}"; do
        (
            build_module "$module"
            echo $? > "/tmp/build_result_$module"
        ) &
        pids+=($!)
    done

    # Wait for all builds to complete
    for i in "${!pids[@]}"; do
        wait "${pids[$i]}"
        local module="${MODULES[$i]}"
        local result=$(cat "/tmp/build_result_$module" 2>/dev/null || echo "1")
        results+=("$result")
        rm -f "/tmp/build_result_$module"
    done

    return "${results[@]}"
}

# Function to build modules sequentially (fallback)
build_modules_sequential() {
    local failed_modules=()

    echo -e "${BLUE}🔄 Building modules sequentially...${NC}"

    for module in "${MODULES[@]}"; do
        if ! build_module "$module"; then
            failed_modules+=("$module")
        fi
    done

    if [ ${#failed_modules[@]} -eq 0 ]; then
        return 0
    else
        echo -e "${RED}❌ Failed modules: ${failed_modules[*]}${NC}"
        return 1
    fi
}

# Function to generate build report
generate_build_report() {
    local report_file="$BUILD_OUTPUT/build-report.json"
    local total_size=0
    local total_files=0

    echo -e "${BLUE}📊 Generating build report...${NC}"

    echo '{' > "$report_file"
    echo '  "buildTime": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",' >> "$report_file"
    echo '  "modules": {' >> "$report_file"

    local first=true
    for module in "${MODULES[@]}"; do
        local manifest="$BUILD_OUTPUT/$module/manifest.json"
        if [ -f "$manifest" ]; then
            if [ "$first" = true ]; then
                first=false
            else
                echo ',' >> "$report_file"
            fi
            echo "    \"$module\": $(cat "$manifest")" >> "$report_file"

            # Extract size and file count for totals
            local size=$(jq -r '.size' "$manifest" 2>/dev/null || echo "0K")
            local files=$(jq -r '.files' "$manifest" 2>/dev/null || echo "0")
            total_files=$((total_files + files))
        fi
    done

    echo '' >> "$report_file"
    echo '  },' >> "$report_file"
    echo '  "summary": {' >> "$report_file"
    echo "    \"totalModules\": $TOTAL_MODULES," >> "$report_file"
    echo "    \"totalFiles\": $total_files," >> "$report_file"
    echo "    \"buildSystem\": \"vite\"," >> "$report_file"
    echo "    \"platform\": \"$(uname -s)\"" >> "$report_file"
    echo '  }' >> "$report_file"
    echo '}' >> "$report_file"

    echo -e "${GREEN}✅ Build report generated: $report_file${NC}"
}

# Function to validate builds
validate_builds() {
    echo -e "${BLUE}🔍 Validating module builds...${NC}"

    local validation_errors=()

    for module in "${MODULES[@]}"; do
        local module_dist="$BUILD_OUTPUT/$module"
        local entry_file="$module_dist/${module}-module.js"
        local manifest_file="$module_dist/manifest.json"

        # Check if entry file exists
        if [ ! -f "$entry_file" ]; then
            validation_errors+=("Module $module missing entry file: $entry_file")
            continue
        fi

        # Check if manifest exists
        if [ ! -f "$manifest_file" ]; then
            validation_errors+=("Module $module missing manifest: $manifest_file")
            continue
        fi

        # Validate JavaScript syntax
        if ! node -c "$entry_file" 2>/dev/null; then
            validation_errors+=("Module $module has invalid JavaScript syntax")
            continue
        fi

        # Check file size (should be reasonable)
        local file_size=$(stat -f%z "$entry_file" 2>/dev/null || stat -c%s "$entry_file" 2>/dev/null || echo "0")
        if [ "$file_size" -lt 100 ]; then
            validation_errors+=("Module $module entry file too small ($file_size bytes)")
            continue
        fi

        echo -e "${GREEN}✅ Module $module validation passed${NC}"
    done

    if [ ${#validation_errors[@]} -eq 0 ]; then
        echo -e "${GREEN}🎉 All modules validated successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Validation errors found:${NC}"
        for error in "${validation_errors[@]}"; do
            echo -e "${RED}  - $error${NC}"
        done
        return 1
    fi
}

# Main execution
main() {
    local start_time=$(date +%s)

    # Try parallel build first, fall back to sequential if needed
    if command -v parallel >/dev/null 2>&1; then
        echo -e "${BLUE}🚀 Using GNU parallel for builds${NC}"
        if ! build_modules_parallel; then
            echo -e "${YELLOW}⚠️  Parallel build had issues, falling back to sequential${NC}"
            build_modules_sequential
        fi
    else
        echo -e "${YELLOW}ℹ️  GNU parallel not available, using sequential builds${NC}"
        if ! build_modules_sequential; then
            echo -e "${RED}❌ Sequential build failed${NC}"
            exit 1
        fi
    fi

    # Validate all builds
    if ! validate_builds; then
        echo -e "${RED}❌ Build validation failed${NC}"
        exit 1
    fi

    # Generate build report
    generate_build_report

    local end_time=$(date +%s)
    local total_duration=$((end_time - start_time))

    echo -e "${GREEN}🎉 Module build orchestration completed successfully${NC}"
    echo -e "${GREEN}📊 Total build time: ${total_duration}s${NC}"
    echo -e "${GREEN}📁 Output directory: $BUILD_OUTPUT${NC}"

    # Show summary
    echo -e "${BLUE}📋 Build Summary:${NC}"
    for module in "${MODULES[@]}"; do
        local manifest="$BUILD_OUTPUT/$module/manifest.json"
        if [ -f "$manifest" ]; then
            local size=$(jq -r '.size' "$manifest" 2>/dev/null || echo "Unknown")
            echo -e "${GREEN}  ✅ $module: $size${NC}"
        else
            echo -e "${RED}  ❌ $module: Build failed${NC}"
        fi
    done
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "Module Build Orchestration Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --clean        Clean builds and exit"
        echo "  --validate     Validate existing builds"
        echo "  --parallel     Force parallel builds"
        echo "  --sequential   Force sequential builds"
        echo ""
        exit 0
        ;;
    --clean)
        echo -e "${YELLOW}🧹 Cleaning build outputs...${NC}"
        rm -rf "$BUILD_OUTPUT"
        echo -e "${GREEN}✅ Clean completed${NC}"
        exit 0
        ;;
    --validate)
        if validate_builds; then
            exit 0
        else
            exit 1
        fi
        ;;
    --parallel)
        build_modules_parallel
        exit $?
        ;;
    --sequential)
        build_modules_sequential
        exit $?
        ;;
    "")
        main
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac