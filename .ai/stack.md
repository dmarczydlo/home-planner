# Technology Stack

## Frontend

- **Astro 5** - Web framework with SSR capabilities
- **React 19** - UI library for dynamic components
- **TypeScript 5** - Type-safe JavaScript
- **Shadcn/ui** - UI component library
- **Tailwind 4** - Utility-first CSS framework

## Backend

- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **PostgreSQL** - Relational database (via Supabase)

## Testing

### Tools

- **Playwright** - End-to-end testing
  - Cross-browser testing (Chromium, Firefox, Safari)
  - Mobile emulation
  - Network interception
  - Screenshot/video on failure

- **Vitest** - Unit and integration testing
  - Fast test execution
  - TypeScript support
  - Code coverage reporting (`@vitest/coverage-v8`)
  - Mock capabilities

### Coverage Targets

- **Unit Tests**: ≥ 80% code coverage
- **Integration Tests**: ≥ 70% code coverage
- **Critical Paths**: 100% coverage

### Test Types

- **Unit Tests**: Service layer, repositories, utilities, domain entities
- **Integration Tests**: API endpoints, database interactions, middleware
- **E2E Tests**: Complete user journeys, onboarding flow, calendar interactions

## CI/CD

- **GitHub Actions** - Continuous integration and deployment
