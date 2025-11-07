# Testing Setup

This project uses **Vitest** for unit and integration testing.

## Installation

To run tests, you need to install Vitest and related dependencies:

```bash
pnpm add -D vitest @vitest/ui
```

## Running Tests

After installation, add these scripts to `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

Then run tests with:

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage

# Open Vitest UI
pnpm test:ui
```

## Test Structure

Tests are located alongside the code they test:

- `src/services/` - Service layer tests
- `src/repositories/` - Repository tests (future)
- `src/pages/api/` - API route tests (future)

## Writing Tests

Tests use Vitest's API which is compatible with Jest:

```typescript
import { describe, it, expect, beforeEach } from "vitest";

describe("MyService", () => {
  it("should do something", () => {
    expect(true).toBe(true);
  });
});
```

## Test Coverage

The project aims for:

- **Services**: >80% coverage
- **Repositories**: >70% coverage
- **API Routes**: >60% coverage
