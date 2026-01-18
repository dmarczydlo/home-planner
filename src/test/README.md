# Test Setup and Utilities

This directory contains test setup files and utilities for unit and integration tests.

## Structure

- `setup.ts` - Global test setup that runs before all tests
- `utils.ts` - Reusable test utilities and helper functions
- `README.md` - This file

## Test Environment

Tests use **Vitest** with the following configuration:

- **Node environment**: Default for service and repository tests
- **jsdom environment**: For React component tests (use `// @vitest-environment jsdom` comment)

## Writing Tests

### Service Tests (Node Environment)

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { MyService } from "./MyService";

describe("MyService", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

### Component Tests (jsdom Environment)

```typescript
import { describe, it, expect } from "vitest";
// @vitest-environment jsdom
import { render } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    const { container } = render(<MyComponent />);
    expect(container).toBeTruthy();
  });
});
```

## Test Utilities

Import utilities from `@/test/utils`:

```typescript
import { createTestUser, createTestFamily, delay } from "@/test/utils";

const user = createTestUser({ email: "custom@example.com" });
const family = createTestFamily({ name: "Custom Family" });
await delay(100); // Wait 100ms
```

## Coverage Targets

- **Unit Tests**: ≥ 80% coverage
- **Integration Tests**: ≥ 70% coverage
- **Critical Paths**: 100% coverage

Run coverage report:
```bash
pnpm test:coverage
```

## Best Practices

1. **Use setup files** for global mocks and configuration
2. **Prefer spies over mocks** when you only need to verify interactions
3. **Use factory patterns** for `vi.mock()` implementations
4. **Clean up mocks** in `afterEach` hooks
5. **Follow Arrange-Act-Assert** pattern for test structure
6. **Use descriptive test names** that explain what is being tested
