# Design System Audit Suite

A comprehensive set of audit scripts to ensure code quality, design consistency, and performance standards for the Conference Party Microservice.

## Quick Start

Run the complete audit suite:
```bash
./tools/design-audit/run-all.sh
```

Run individual audits:
```bash
./tools/design-audit/30_css_tokens_audit.sh  # Check token usage
./tools/design-audit/70_accessibility_audit.sh # Test accessibility
```

## Audit Scripts

### Core Infrastructure
- **00_env_probe.sh** - System health, deployment status, and environment verification
- **_lib.sh** - Shared functions and path definitions for all scripts

### Design & Layout
- **10_layout_nav_audit.sh** - Grid systems, sidebar structure, navigation patterns
- **20_cards_audit.sh** - Card component implementation and flexibility
- **30_css_tokens_audit.sh** - Design token compliance and hardcoded values

### Integration & APIs
- **40_maps_audit.sh** - Google Maps API configuration and security
- **50_calendar_audit.sh** - Calendar OAuth and endpoint validation
- **60_api_parties_audit.sh** - API health and data structure validation

### Quality & Performance
- **70_accessibility_audit.sh** - ARIA attributes, semantic HTML, keyboard navigation
- **80_perf_bundle_audit.sh** - Bundle sizes, caching strategies, optimization
- **90_duplication_audit.sh** - Code duplication, naming conflicts, redundancy

### Legacy Analysis
- **token-check.sh** - Original token compliance checker
- **css-audit.sh** - CSS architecture and methodology analysis
- **component-audit.sh** - Component structure and organization

## Key Metrics

### ✅ Current Status
- **0** hardcoded px values (all migrated to tokens)
- **624** spacing token uses
- **107** radius token uses
- **45** files using grid layouts
- **276** hardcoded colors (migration needed)

### ⚠️ Issues Found
- **23** duplicate CSS selectors
- **11** duplicate JavaScript functions
- **10** duplicate component filenames
- Multiple sidebar CSS files need consolidation

### 📊 Coverage
- **88** CSS files analyzed
- **284** JavaScript files scanned
- **22** HTML files reviewed
- **13** comprehensive audit categories

## Design Principles Enforced

1. **Two-column layout** - Sidebar + content, no third rail
2. **Token-first spacing** - All spacing uses CSS variables
3. **Flexible cards** - No fixed heights, content-aware
4. **Accessibility-first** - ARIA labels, semantic HTML
5. **Performance-optimized** - Async loading, service workers
6. **Clean architecture** - No duplicate endpoints or exports

## Usage Recommendations

### Before Design Changes
Run the full audit to establish baseline:
```bash
./tools/design-audit/run-all.sh > baseline.txt
```

### After Changes
Compare results to ensure no regressions:
```bash
./tools/design-audit/run-all.sh > after.txt
diff baseline.txt after.txt
```

### CI/CD Integration
Add to your build pipeline:
```yaml
- name: Design Audit
  run: |
    ./tools/design-audit/run-all.sh
    if grep -q "err\|ERR" design-audit-*.txt; then
      echo "Design audit failed"
      exit 1
    fi
```

## Interpreting Results

### Success Indicators
- ✅ `ok` - Passed check
- 📊 Metrics within acceptable range
- No duplicate endpoints or exports

### Warning Signs
- ⚠️ `warn` - Needs attention but not critical
- Duplicate selectors or functions
- Missing accessibility attributes

### Critical Issues
- ❌ `err` - Must fix before deployment
- Duplicate HTML IDs
- Exposed API keys
- Missing critical files

## Maintenance

### Adding New Audits
1. Create script in `tools/design-audit/XX_name_audit.sh`
2. Source the shared library: `source "$(dirname "$0")/_lib.sh"`
3. Add to `run-all.sh` AUDITS array
4. Make executable: `chmod +x XX_name_audit.sh`

### Updating Thresholds
Edit relevant script to adjust warning/error thresholds:
```bash
# Example: Change bundle size limit
if [ "$BUNDLE_SIZE" -gt 500000 ]; then  # 500KB
  warn "Bundle too large"
fi
```

## Best Practices

1. **Run regularly** - Include in PR checks
2. **Track trends** - Monitor metric changes over time
3. **Fix incrementally** - Address warnings before they become errors
4. **Document exemptions** - If ignoring a warning, document why
5. **Update tests** - Keep audit criteria current with project needs

## Support

For issues or improvements to the audit suite:
- Check existing audit output for detailed error messages
- Review individual script comments for specific requirements
- Contribute new audit scripts for missing coverage areas