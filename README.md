# Home Planner

[![Project Status: WIP](https://img.shields.io/badge/status-work_in_progress-yellow.svg)](https://github.com/user/home-planner)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A web application designed to help families better coordinate and plan their schedules. It provides a centralized, shared calendar system that integrates with popular calendar services, accounts for both fixed commitments and flexible time slots, and supports the management of multiple family members' schedules. The goal is to improve planning and coordination of family activities and tasks, reducing scheduling conflicts.

## Table of Contents

- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Testing](#testing)
- [Project Scope](#project-scope)
- [Architecture](#architecture)
- [Project Status](#project-status)
- [License](#license)

## Tech Stack

| Category     | Technology                                 |
| ------------ | ------------------------------------------ |
| **Frontend** | Astro 5, React 19, TypeScript 5, Shadcn/ui, Tailwind 4 |
| **Backend**  | Supabase, PostgreSQL                       |
| **Testing**  | Playwright (E2E), Vitest (Unit/Integration) |
| **CI/CD**    | GitHub Actions                             |

## Getting Started Locally

### Prerequisites

- Node.js (v20.x recommended - based on modern stack, `.nvmrc` not yet present)
- `pnpm` (or your preferred package manager)

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/<your-github-username>/home-planner.git
    cd home-planner
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**

    Create a `.env` file in the root of the project by copying the example:

    ```bash
    cp .env.example .env
    ```

    You will need to add your Supabase project URL and anon key to the `.env` file:

    ```
    PUBLIC_SUPABASE_URL="your-supabase-url"
    PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
    ```

4.  **Run the development server:**
    ```bash
    pnpm dev
    ```

The application should now be running on [http://localhost:4321](http://localhost:4321).

## Testing

The project uses a comprehensive testing strategy with multiple test types:

### Test Types

- **Unit Tests**: Test individual components, services, and functions in isolation using Vitest
- **Integration Tests**: Test interactions between components and external systems using Vitest
- **End-to-End Tests**: Test complete user workflows from UI to database using Playwright

### Test Coverage Targets

- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: Minimum 70% code coverage
- **Critical Paths**: 100% coverage

### Test Tools

- **Vitest**: Fast unit and integration testing with TypeScript support and coverage reporting
- **Playwright**: Cross-browser E2E testing with mobile emulation and network interception

### Test Environment

Tests can run against:
- **In-memory repositories**: For fast unit testing
- **Test database**: For integration testing
- **Staging environment**: For E2E testing

For detailed test scenarios and test plan, see [`.ai/test-plan.md`](.ai/test-plan.md).

## Available Scripts

The following scripts are available in the `package.json`:

| Script           | Description                                    |
| ---------------- | ---------------------------------------------- |
| `dev`            | Starts the development server.                 |
| `start`          | Starts the development server.                 |
| `build`          | Builds the application for production.         |
| `preview`        | Previews the production build locally.         |
| `test:e2e`       | Runs end-to-end tests with Playwright.         |
| `test:e2e:ui`    | Opens Playwright UI for interactive testing.  |
| `test:unit`      | Runs unit and integration tests with Vitest.  |
| `test:coverage`  | Runs tests with coverage reporting.            |

## Project Scope

### In Scope for MVP

- **User Management:** User authentication via "Sign in with Google", family creation, and management of adult members and child profiles.
- **Calendar:** Core calendar functionality with Day, Week, Month, and Agenda views.
- **Event Management:** Creation and management of "Elastic" (flexible) and "Blocker" (rigid) events, with support for basic recurring events (daily, weekly, monthly).
- **Integrations:** Read-only, one-way sync with Google Calendar and Microsoft 365 Calendar.
- **UX/UI:** Filtering calendar views by family member and a responsive design for desktop and mobile browsers.
- **Onboarding:** A step-by-step wizard for new users.

### Out of Scope for MVP

- Two-way synchronization with external calendars.
- Advanced notification system.
- Completion states for tasks/events (e.g., 'to-do', 'done').
- Advanced recurrence options.
- Native mobile applications (iOS/Android).
- File attachments or detailed notes for events.
- Public sharing of calendars.

## Architecture

This repository follows a lightweight Hexagonal Architecture (Ports & Adapters) for backend data access:

- **Ports (Interfaces):** Repository contracts define the domain-facing API (e.g., `FamilyRepository`, `EventRepository`).
- **Adapters (Implementations):** Standardized per repository, e.g., `SQLFamilyRepository` and `InMemoryFamilyRepository` (same pattern for other repositories like events and users).
- **Injection:** Repositories are created per-request and exposed via `context.locals` in Astro middleware, keeping routes framework-agnostic from the data layer.

For details and rationale, see `.ai/hexagonal-architecture-proposal.md`.

## Project Status

The project is currently in the **planning and initial setup phase**. The core requirements and tech stack have been defined. The next steps involve bootstrapping the project structure and beginning development of the core features.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
