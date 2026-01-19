# Test Utilities and Helpers

This directory contains test utilities, helpers, and setup files for unit testing React components and hooks.

## Structure

```
src/test/
├── setup.ts              # Global test setup (runs before all tests)
├── utils.ts              # General test utilities (for service tests)
├── utils/
│   ├── render.tsx        # Custom render function with providers
│   ├── mock-data.ts      # Mock data factories
│   ├── accessibility.ts  # Accessibility testing helpers
│   └── index.ts         # Central export point
└── README.md             # This file
```

## Usage

### Custom Render Function

Use the custom `render` function instead of the default from `@testing-library/react`. It automatically wraps components with necessary providers:

```typescript
import { render, screen } from "@/test/utils/render";
import { MyComponent } from "./MyComponent";

test("renders component", () => {
  render(<MyComponent />);
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

To skip provider wrapping (e.g., when testing providers themselves):

```typescript
render(<MyComponent />, { withProviders: false });
```

### Mock Data Factories

Create test data easily:

```typescript
import { createMockUser, createMockFamily, createMockEvent } from "@/test/utils/mock-data";

const user = createMockUser({ email: "custom@example.com" });
const family = createMockFamily({ name: "Custom Family" });
const event = createMockEvent({ title: "Custom Event" });
```

### Mock Functions

Use Vitest's `vi` for mocking:

```typescript
import { vi } from "vitest";

// Mock a module
vi.mock("@/hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

// Create a mock function
const mockFn = vi.fn();
```

### Testing Patterns

#### AAA Pattern (Arrange-Act-Assert)

```typescript
test("example test", () => {
  // Arrange
  const mockFn = vi.fn();
  render(<Component onClick={mockFn} />);
  
  // Act
  fireEvent.click(screen.getByRole("button"));
  
  // Assert
  expect(mockFn).toHaveBeenCalledTimes(1);
});
```

#### Testing User Interactions

```typescript
import userEvent from "@testing-library/user-event";

test("user interaction", async () => {
  const user = userEvent.setup();
  render(<Component />);
  
  await user.click(screen.getByRole("button"));
  await user.type(screen.getByLabelText("Email"), "test@example.com");
});
```

#### Testing Async Behavior

```typescript
import { waitFor } from "@/test/utils/render";

test("async behavior", async () => {
  render(<AsyncComponent />);
  
  await waitFor(() => {
    expect(screen.getByText("Loaded")).toBeInTheDocument();
  });
});
```

#### When to use `act()`

Use `act()` **only when you directly trigger React state updates outside Testing Library helpers**, especially in hook tests:

- **Calling hook methods that update state** (e.g. `result.current.refetch()`, `result.current.createFamily()`)
- **Resolving deferred promises** that cause state updates (e.g. completing a mocked `fetch`)
- **Advancing fake timers** (`vi.advanceTimersByTime`, `vi.runAllTimers`) when timers drive state updates

Prefer **not** to use `act()` for typical DOM interactions:

- `userEvent` already wraps interactions in `act()` internally
- `waitFor` already retries within an `act()` boundary for rendered updates

Example (hook action + deferred promise):

```typescript
import { renderHook, waitFor, act } from "@/test/utils/render";

test("loading state during async hook action", async () => {
  let resolveFetch: ((value: any) => void) | null = null;
  vi.mocked(global.fetch).mockImplementation(
    () =>
      new Promise((resolve) => {
        resolveFetch = resolve;
      })
  );

  const { result } = renderHook(() => useMyHook());

  let promise: Promise<unknown> | null = null;
  await act(async () => {
    promise = result.current.doSomethingAsync();
  });

  await waitFor(() => expect(result.current.isLoading).toBe(true));

  if (!resolveFetch) throw new Error("Expected fetch resolver");
  resolveFetch({ ok: true, json: async () => ({}) } as Response);

  await act(async () => {
    await promise;
  });

  await waitFor(() => expect(result.current.isLoading).toBe(false));
});
```

#### Testing Accessibility

```typescript
import { assertNoAccessibilityViolations } from "@/test/utils/accessibility";

test("accessibility", async () => {
  await assertNoAccessibilityViolations(<Component />);
});
```

## Environment Setup

Component tests use the `jsdom` environment. Add this comment at the top of component test files:

```typescript
// @vitest-environment jsdom
```

## Best Practices

1. **Use descriptive test names**: Test names should clearly describe what is being tested
2. **Follow AAA pattern**: Arrange, Act, Assert
3. **Test behavior, not implementation**: Focus on what users see and interact with
4. **Mock dependencies**: Use `vi.mock()` to mock external dependencies
5. **Clean up**: Mocks are automatically cleaned up after each test
6. **Use proper queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
7. **Test accessibility**: Ensure components are accessible to all users

## Examples

See example test files:
- `src/components/auth/GoogleSignInButton.test.tsx`
- `src/components/auth/AuthErrorDisplay.test.tsx`
