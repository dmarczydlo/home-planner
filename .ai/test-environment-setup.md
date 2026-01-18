# Test Environment Setup Summary

This document summarizes the test environment configuration for unit and E2E tests.

## ✅ Completed Setup

### 1. Vitest Configuration (`vitest.config.ts`)

**Features:**
- ✅ Global test configuration with `globals: true`
- ✅ Setup files support (`./src/test/setup.ts`)
- ✅ Coverage thresholds:
  - Lines: 80%
  - Functions: 80%
  - Branches: 80%
  - Statements: 80%
- ✅ TypeScript type checking enabled
- ✅ Path aliases configured (`@/*` → `./src/*`)

**Environments:**
- **Node**: Default for service/repository tests
- **jsdom**: Available for component tests (use `// @vitest-environment jsdom`)

### 2. Playwright Configuration (`playwright.config.ts`)

**Features:**
- ✅ Chromium/Desktop Chrome only (as per guidelines)
- ✅ Browser context isolation configured
- ✅ Parallel execution (4 workers in mock mode)
- ✅ Trace viewer on first retry
- ✅ Screenshot/video on failure
- ✅ Test hooks via fixtures (`e2e/fixtures/`)

**Configuration:**
- Base URL: `http://localhost:4321`
- Retries: 2 in CI, 0 locally
- Viewport: 1280x720
- Web server auto-start with `pnpm dev`

### 3. Test Setup Files

**Created:**
- `src/test/setup.ts` - Global test setup with mock cleanup
- `src/test/utils.ts` - Reusable test utilities and helpers
- `src/test/README.md` - Test documentation

**Features:**
- Automatic mock cleanup after each test
- Test data factories (`createTestUser`, `createTestFamily`)
- Utility functions (`delay`, `createMockFn`)

### 4. Dependencies

**Added:**
- `jsdom@^25.0.1` - For DOM/component testing
- `@vitest/ui@^4.0.7` - Vitest UI mode

**Existing:**
- `vitest@^4.0.7` - Test runner
- `@vitest/coverage-v8@^4.0.15` - Coverage provider
- `@playwright/test@^1.57.0` - E2E testing

### 5. Test Scripts

**Unit Tests:**
```bash
pnpm test              # Watch mode
pnpm test:run          # Run once
pnpm test:coverage     # With coverage report
pnpm test:ui           # UI mode
```

**E2E Tests:**
```bash
pnpm test:e2e         # Run all E2E tests
pnpm test:e2e:ui      # UI mode
pnpm test:e2e:debug   # Debug mode
pnpm test:e2e:headed  # Headed browser
pnpm test:e2e:onboarding  # Onboarding tests only
pnpm test:e2e:report  # Show HTML report
```

## 📋 Test Structure

### Unit Tests
- Location: `src/**/*.{test,spec}.{ts,tsx}`
- Environment: Node (default) or jsdom (for components)
- Examples: `src/services/*.test.ts`

### E2E Tests
- Location: `e2e/**/*.spec.ts`
- Browser: Chromium/Desktop Chrome
- Fixtures: `e2e/fixtures/`
- Examples: `e2e/onboarding/*.spec.ts`

## 🎯 Coverage Targets

As per `.ai/stack.md`:
- **Unit Tests**: ≥ 80% coverage
- **Integration Tests**: ≥ 70% coverage
- **Critical Paths**: 100% coverage

## 🔧 Best Practices

### Unit Tests (Vitest)
1. Use `vi.fn()` for function mocks
2. Use `vi.spyOn()` to monitor existing functions
3. Place mock factories at top level
4. Use setup files for global configuration
5. Clean up mocks in `afterEach` hooks
6. Follow Arrange-Act-Assert pattern

### E2E Tests (Playwright)
1. Use Page Object Model pattern
2. Use locators for element selection
3. Leverage browser contexts for isolation
4. Use fixtures for authentication/setup
5. Implement visual comparison with screenshots
6. Use trace viewer for debugging

## 📝 Next Steps

1. **Component Tests**: Add React component tests using jsdom environment
2. **Integration Tests**: Add API endpoint tests with test database
3. **Test Coverage**: Monitor and improve coverage to meet thresholds
4. **CI/CD**: Configure GitHub Actions for automated testing

## 🔍 Verification

Both test environments have been verified:
- ✅ Vitest: Tests run successfully with setup file
- ✅ Playwright: Test discovery works correctly
- ✅ Configurations: No linting errors

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- Test guidelines: `.cursor/rules/unit-tests.mdc` and `.cursor/rules/e2e-tests.mdc`
- Stack info: `.ai/stack.md`
