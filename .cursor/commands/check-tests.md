# Test Coverage and Quality Check

This workflow runs comprehensive tests across all packages with coverage reporting and identifies any issues.

## Tasks:

1. **Run all package tests with coverage reporting**
   - Execute tests for frontend, backend, shared, and UI packages
   - Generate coverage reports for analysis
   - Use non-interactive mode to avoid manual intervention

2. **Identify and fix any failing tests**
   - Analyze test results for failures
   - Fix any broken tests or test configurations
   - Ensure all tests pass before proceeding

3. **Ensure test coverage meets required thresholds**
   - Review coverage reports for each package
   - Identify areas with low coverage
   - Verify coverage meets project standards

4. **Generate coverage reports**
   - Create coverage reports for FE and BE
   - Do NOT save reports to the repository (coverage/ directories are gitignored)
   - Analyze coverage data for quality insights

5. **Update coverage configuration if needed**
   - Adjust coverage thresholds if necessary
   - Update test configurations for better coverage
   - Ensure consistent coverage reporting across packages

6. **Update tests to achieve coverage thresholds**
   - Add missing tests for uncovered code paths
   - Focus on critical business logic and components
   - Prioritize testing based on coverage gaps
   - Ensure edge cases and error conditions are tested

## Commands to run:

### Frontend Tests

```bash
cd apps/frontend
bun run test:coverage
```

- Uses Vitest with coverage reporting via bun
- Generates coverage report in `coverage/` directory

### Backend Tests

```bash
cd apps/backend
bun run test:coverage
```

- Uses Mocha with coverage reporting via bun
- Generates coverage report in `coverage/` directory

### Shared Package Tests

```bash
cd packages/shared
bun run test:coverage
```

- Uses Vitest with coverage reporting via bun
- Generates coverage report in `coverage/` directory

### UI Package Tests

```bash
cd packages/ui
bun run test:coverage
```

- Uses Vitest with coverage reporting via bun
- Generates coverage report in `coverage/` directory

## Coverage Analysis:

### Expected Coverage Thresholds:

- **Shared Package**: Should maintain >95% coverage (utility functions)
- **Backend**: Should maintain >80% coverage (business logic)
- **Frontend**: Should maintain >70% coverage (components and pages)
- **UI Package**: Should maintain >60% coverage (reusable components)

### Coverage Report Locations:

- Frontend: `apps/frontend/coverage/`
- Backend: `apps/backend/coverage/`
- Shared: `packages/shared/coverage/`
- UI: `packages/ui/coverage/`

## Expected Outcomes:

- ✅ All tests passing across all packages
- ✅ Coverage reports generated for analysis
- ✅ Coverage thresholds met or exceeded
- ✅ No failing tests or configuration issues
- ✅ Test suite runs in non-interactive mode

## Troubleshooting:

### Common Issues:

1. **Tests hanging**: Use `--run` flag for Vitest packages
2. **Coverage not generated**: Check if coverage tools are properly configured
3. **Low coverage**: Focus on testing business logic and critical components first
4. **Test failures**: Check test setup and dependencies

### Improving Coverage:

1. **Identify uncovered files**: Review coverage reports to find files with 0% coverage
2. **Prioritize by importance**: Focus on business logic, utilities, and critical components first
3. **Add missing test cases**: Cover edge cases, error conditions, and alternative code paths
4. **Test component interactions**: Ensure components work together properly
5. **Mock external dependencies**: Use proper mocking to isolate units under test
6. **Follow AAA pattern**: Arrange, Act, Assert structure for clear test organization

### Coverage Improvement Strategies:

#### Frontend (Target: >70%)

- **Priority 1**: Test UI components in `src/components/ui/` (currently 0% coverage)
- **Priority 2**: Add integration tests for page components
- **Priority 3**: Test hooks and utilities thoroughly
- **Focus**: Component rendering, user interactions, state management

#### Backend (Target: >80%)

- **Priority 1**: Improve branch coverage (currently 54.82%)
- **Priority 2**: Test error handling paths in use cases
- **Priority 3**: Add tests for repository edge cases
- **Focus**: Business logic, error conditions, validation

#### UI Package (Target: >60%)

- **Priority 1**: Test all component variants and props
- **Priority 2**: Add interaction tests (clicks, form submissions)
- **Priority 3**: Test accessibility features
- **Focus**: Component behavior, styling, user interactions

#### Shared Package (Target: >95%)

- **Status**: Already exceeds threshold (97.57%)
- **Maintenance**: Keep coverage high as utilities are critical
- **Focus**: Edge cases, error handling, type safety

### Reference Documentation:

- Check `docs/testing-strategy.md` for detailed testing guidelines and coverage commands
- Review package-specific test configurations in `vitest.config.ts` or `mocha` configs
- Use `bun run test:coverage` for all packages as per testing strategy
