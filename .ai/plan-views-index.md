# View Implementation Plans Index
## Mobile-First Design

## Overview

This document provides an index of all view implementation plans. Each plan is a standalone document that can be implemented independently, following mobile-first design principles.

## Available Plans

### 1. Authentication View
**File**: `plan-view-authentication.md`

**Purpose**: Handle user authentication via Google Sign-in (OAuth 2.0)

**Route**: `/auth/login`

**Key Features**:
- Google OAuth integration
- OAuth callback handling
- Auth state management
- Error handling

**Dependencies**: None (entry point)

**Implementation Order**: 1 (First)

---

### 2. Onboarding Wizard
**File**: `plan-view-onboarding.md`

**Purpose**: Guide new users through initial setup

**Routes**: `/onboarding/*` (multi-step)

**Steps**:
1. Welcome & Family Name
2. Connect Calendar
3. Add Children
4. Invite Members

**Key Features**:
- Multi-step wizard
- Progress tracking
- Skip functionality
- OAuth calendar connection

**Dependencies**: Authentication

**Implementation Order**: 2 (After authentication)

---

### 3. Calendar Views
**File**: `plan-view-calendar.md`

**Purpose**: Display family calendar events in multiple views

**Routes**: 
- `/calendar/day`
- `/calendar/week` (default)
- `/calendar/month`
- `/calendar/agenda`

**Key Features**:
- Four view types (Day, Week, Month, Agenda)
- Event filtering
- Date navigation
- Member filtering

**Dependencies**: Authentication, Family data

**Implementation Order**: 3 (Core feature)

---

### 4. Event Management
**File**: `plan-view-events.md`

**Purpose**: Create, edit, view, and delete calendar events

**Routes**: Modal/bottom sheet overlays

**Key Features**:
- Create events (Elastic/Blocker)
- Edit events (single/recurring)
- Delete events
- Conflict detection
- Recurrence support

**Dependencies**: Calendar views, Family data

**Implementation Order**: 4 (After calendar views)

---

### 5. Family Management
**File**: `plan-view-family.md`

**Purpose**: Manage family members, children, and invitations

**Routes**:
- `/family/overview`
- `/family/members`
- `/family/children`
- `/family/invitations`

**Key Features**:
- View family members
- Add/remove children
- Invite family members
- Manage invitations
- Role management

**Dependencies**: Authentication, Family data

**Implementation Order**: 5 (Can be parallel with calendar)

---

### 6. Settings View
**File**: `plan-view-settings.md`

**Purpose**: Manage external calendars, preferences, and account

**Routes**:
- `/settings/calendars`
- `/settings/preferences`
- `/settings/account`

**Key Features**:
- Connect external calendars
- View sync status
- Manual sync
- App preferences
- Account management

**Dependencies**: Authentication

**Implementation Order**: 6 (Can be parallel)

---

### 7. Profile View
**File**: `plan-view-profile.md`

**Purpose**: Display and manage user profile

**Routes**:
- `/profile/me`
- `/profile/families`

**Key Features**:
- View user profile
- Edit profile information
- View family memberships
- Switch between families
- Logout

**Dependencies**: Authentication

**Implementation Order**: 7 (Can be parallel)

---

## Implementation Strategy

### Phase 1: Foundation
1. **Authentication View** - Entry point
2. **Onboarding Wizard** - First-time user flow

### Phase 2: Core Features
3. **Calendar Views** - Main functionality
4. **Event Management** - Event CRUD

### Phase 3: Management
5. **Family Management** - Family operations
6. **Settings View** - Configuration
7. **Profile View** - User management

## Plan Structure

Each plan includes:

1. **Overview** - Purpose, routes, key features
2. **Mobile-First Design** - Layout specifications
3. **Component Structure** - Component hierarchy
4. **User Flow** - Step-by-step flows
5. **API Integration** - Endpoints and integration
6. **State Management** - Context and hooks
7. **Mobile-Specific Features** - Touch, gestures, etc.
8. **Accessibility** - WCAG compliance
9. **Implementation Checklist** - Phase-by-phase tasks
10. **File Structure** - Code organization
11. **Success Criteria** - Acceptance criteria

## Common Patterns

### Mobile-First Components
- **Bottom Sheets**: Forms and modals on mobile
- **Swipe Actions**: Edit/delete on cards
- **Pull to Refresh**: Data refresh
- **Native Pickers**: Date/time inputs

### State Management
- **React Context**: Global state (Auth, Family, Calendar)
- **React Query**: Server state caching
- **Optimistic Updates**: Immediate UI feedback

### API Integration
- **REST API**: All endpoints documented in `api-plan.md`
- **Error Handling**: Consistent error patterns
- **Loading States**: Skeleton screens and spinners

### Accessibility
- **WCAG AA**: Minimum compliance
- **Keyboard Navigation**: Full support
- **Screen Readers**: VoiceOver/TalkBack support
- **Touch Targets**: Minimum 44x44px

## Dependencies Between Views

```
Authentication
    │
    ├──> Onboarding
    │       │
    │       └──> Calendar (needs family)
    │               │
    │               └──> Events (needs calendar)
    │
    ├──> Family (needs auth)
    │
    ├──> Settings (needs auth)
    │
    └──> Profile (needs auth)
```

## Testing Strategy

Each view should have:
- **Unit Tests**: Component logic
- **Integration Tests**: API integration
- **E2E Tests**: Complete user flows
- **Accessibility Tests**: WCAG compliance
- **Mobile Tests**: Real device testing

## Performance Targets

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

## Next Steps

1. Review all plan documents
2. Prioritize implementation order
3. Set up project structure
4. Implement Phase 1 (Foundation)
5. Iterate through remaining phases
6. Test on mobile devices
7. Optimize performance
8. Ensure accessibility

## Related Documents

- **UI Architecture** (`.ai/ui-architecture.md`) - Overall architecture
- **User Journey Maps** (`.ai/user-journey-maps.md`) - User flows
- **Navigation Structure** (`.ai/navigation-structure.md`) - Navigation patterns
- **API Plan** (`.ai/api-plan.md`) - API endpoints
- **UI Planning Summary** (`.ai/ui-planning-summary.md`) - Overview

