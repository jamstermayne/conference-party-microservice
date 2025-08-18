# E2E Test Suite - Optimized

## Overview
Comprehensive end-to-end testing for the Conference Party Microservice PWA using Playwright.

## Test Structure

```
tests/e2e/
├── _helpers.ts           # Mock utilities for Maps API and data
├── _assertions.ts        # Custom assertions with better error messages
├── pages/                # Page Object Model
│   ├── HomePage.ts       # Home page interactions
│   └── PanelPage.ts      # Panel interactions
├── home.spec.ts          # Original home tests
├── channels.spec.ts      # Channel navigation tests
├── map.spec.ts           # Map panel tests
├── home-optimized.spec.ts   # Optimized tests with POM
├── accessibility.spec.ts    # WCAG accessibility tests
└── performance.spec.ts      # Performance monitoring
```

## Optimizations Applied

### 1. Performance
- **Parallel Execution**: Tests run on 4 workers locally, 2 in CI
- **Mobile Testing**: Added iPhone 13 device testing
- **Reduced Timeouts**: 30s max timeout, 10s action timeout
- **Smart Retries**: 2 retries in CI, 0 locally

### 2. CI/CD Workflow
- **Matrix Strategy**: Parallel chromium + mobile testing
- **Caching**: Node modules + Playwright browsers cached
- **Artifacts**: Test results, traces on failure
- **Manual Trigger**: workflow_dispatch for on-demand runs

### 3. Code Quality
- **Page Object Model**: Reusable page interactions
- **Custom Assertions**: Better error messages
- **Type Safety**: Full TypeScript support
- **Accessibility**: WCAG AA compliance tests

### 4. Test Coverage
- **10 Core Tests**: Navigation, panels, channels
- **5 Accessibility Tests**: Keyboard, ARIA, contrast
- **5 Performance Tests**: Load time, animations, memory

## Running Tests

```bash
# All tests
npm run e2e

# Production with mocked data (default)
npm run e2e:prod

# Production with live data
E2E_MOCK=0 npm run e2e:prod

# Local dev server
npm run e2e:dev

# Specific project
npx playwright test --project=mobile

# With UI mode
npx playwright test --ui

# Debug mode
npx playwright test --debug
```

## Performance Metrics

- **Test Execution**: ~7.5s for 10 tests (4 workers)
- **CI Pipeline**: ~2-3 minutes total
- **First Contentful Paint**: < 1.5s requirement
- **Panel Animations**: < 500ms open/close

## Best Practices

1. **Use Page Objects**: Encapsulate page interactions
2. **Custom Assertions**: Provide context in failures
3. **Mock External APIs**: Deterministic testing
4. **Parallel Execution**: Maximize throughput
5. **Smart Selectors**: Use semantic HTML roles

## Debugging

```bash
# View trace for failed test
npx playwright show-trace test-results/*/trace.zip

# Generate HTML report
npx playwright show-report

# Run specific test
npx playwright test home.spec.ts:37

# Run with headed browser
npx playwright test --headed
```

## CI/CD Integration

The workflow runs automatically on:
- Push to main branch
- Pull requests
- Manual trigger (workflow_dispatch)

Artifacts are retained:
- Test results: 7 days
- Failure traces: 30 days