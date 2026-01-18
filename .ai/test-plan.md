# Test Plan - Home Planner Application

## <project_analysis>

### Key Project Components

#### 1. **Core Domain Entities**
- **Families**: Central organizational unit for grouping users and children
- **Users**: Adult members authenticated via Google OAuth
- **Children**: Child profiles managed by adult members (no separate accounts)
- **Events**: Calendar entries with two types:
  - **Elastic Events**: Flexible, can be rescheduled
  - **Blocker Events**: Fixed commitments, cannot be overridden
- **Event Participants**: Polymorphic relationship supporting both users and children
- **Event Exceptions**: Modifications to recurring events
- **External Calendars**: Integration with Google Calendar and Microsoft 365 (read-only sync)
- **Invitations**: System for inviting adult members to families
- **Logs**: Audit trail for all family actions

#### 2. **Architecture Layers**
- **Domain Layer**: Business entities, DTOs, and repository interfaces (Ports)
- **Infrastructure Layer**: Repository implementations (Adapters) - SQL and in-memory
- **Application Layer**: Astro API routes acting as controllers
- **Presentation Layer**: Astro pages with React components for dynamic UI

#### 3. **Key Features**
- **Authentication**: Google OAuth via Supabase Auth
- **Authorization**: Role-based (admin/member) with family membership checks
- **Calendar Views**: Day, Week, Month, and Agenda views
- **Event Management**: CRUD operations with recurrence support (daily, weekly, monthly)
- **Conflict Detection**: Validation system for scheduling conflicts
- **External Calendar Sync**: One-way synchronization from external calendars
- **Onboarding Flow**: Multi-step wizard for new users
- **Family Management**: Create families, invite members, manage children profiles

#### 4. **API Endpoints Structure**
- `/api/auth/*` - Authentication endpoints
- `/api/users/*` - User profile management
- `/api/families/*` - Family CRUD and member management
- `/api/families/[familyId]/children/*` - Child profile management
- `/api/families/[familyId]/invitations/*` - Invitation management
- `/api/events/*` - Event CRUD and validation
- `/api/external-calendars/*` - Calendar integration management
- `/api/logs/*` - Audit log retrieval

### Technology Stack Specifics and Testing Implications

#### **Frontend Technologies**

1. **Astro 5**
   - **Testing Impact**: SSR capabilities require testing both server-side rendering and client-side hydration
   - **Considerations**: Test page generation, API route handling, middleware execution
   - **Challenges**: Astro's hybrid rendering model requires both static and dynamic testing approaches

2. **React 19**
   - **Testing Impact**: Component testing with React Testing Library, hook testing
   - **Considerations**: React 19 features (useFormStatus, useOptimistic) require updated testing patterns
   - **Challenges**: Client-side state management, form handling, context providers

3. **TypeScript 5**
   - **Testing Impact**: Type safety reduces runtime errors but requires type-aware testing tools
   - **Considerations**: Type checking in tests, mock type definitions
   - **Challenges**: Ensuring type safety in test mocks and fixtures

4. **Shadcn/ui + Tailwind 4**
   - **Testing Impact**: UI component testing, accessibility testing, responsive design validation
   - **Considerations**: Component library integration, theme system, dark mode
   - **Challenges**: Visual regression testing, cross-browser compatibility

#### **Backend Technologies**

1. **Supabase (PostgreSQL)**
   - **Testing Impact**: Database integration testing, RLS policy validation, migration testing
   - **Considerations**: Row-Level Security policies must be tested, connection pooling, transaction handling
   - **Challenges**: Testing RLS policies, database state management, migration rollback scenarios

2. **Hexagonal Architecture**
   - **Testing Impact**: Repository pattern enables easy mocking with in-memory implementations
   - **Considerations**: Test both SQL and in-memory repositories, service layer isolation
   - **Challenges**: Ensuring repository implementations behave identically, integration testing

#### **Testing Tools**

1. **Playwright (E2E)**
   - **Strengths**: Cross-browser testing, mobile emulation, network interception
   - **Considerations**: OAuth mocking strategy, test data management, parallel execution
   - **Challenges**: Flaky tests, test isolation, performance

2. **Vitest (Unit/Integration)**
   - **Strengths**: Fast execution, TypeScript support, coverage reporting
   - **Considerations**: Service layer testing, repository testing, mock management
   - **Challenges**: Async testing, time-dependent tests, database state

### Testing Priorities Based on Repository Structure

#### **Priority 1: Critical Business Logic**
1. **Event Conflict Detection**: Core feature preventing scheduling conflicts
2. **Authorization & Security**: Family membership checks, role-based permissions
3. **Recurring Events**: Complex logic for event series and exceptions
4. **External Calendar Sync**: Data integrity during synchronization

#### **Priority 2: User Flows**
1. **Onboarding Flow**: Complete user journey from signup to first calendar view
2. **Event Management**: Create, update, delete events with various configurations
3. **Family Management**: Invite members, manage children, update family details
4. **Calendar Views**: All four view types (Day, Week, Month, Agenda)

#### **Priority 3: Integration Points**
1. **OAuth Flow**: Google authentication integration
2. **External Calendar APIs**: Google Calendar and Microsoft 365 integration
3. **Database Operations**: RLS policies, migrations, data integrity

#### **Priority 4: Edge Cases & Error Handling**
1. **Invalid Input**: Form validation, API validation
2. **Network Failures**: Offline scenarios, API timeouts
3. **Concurrent Operations**: Multiple users modifying same data
4. **Data Migration**: Schema changes, data migration scenarios

### Potential Risk Areas Requiring Special Attention

#### **1. Security & Authorization**
- **Risk**: Unauthorized access to family data
- **Why Critical**: Family data privacy is paramount; RLS policies must be bulletproof
- **Testing Focus**: 
  - Cross-family data access attempts
  - Role escalation attempts
  - Token manipulation scenarios
  - RLS policy bypass attempts

#### **2. Event Conflict Detection**
- **Risk**: Incorrect conflict detection leading to double-booking
- **Why Critical**: Core value proposition of the application
- **Testing Focus**:
  - Overlapping blocker events
  - Elastic vs blocker interactions
  - Recurring event conflicts
  - Timezone edge cases
  - All-day event conflicts

#### **3. External Calendar Synchronization**
- **Risk**: Data loss or corruption during sync
- **Why Critical**: Users rely on external calendar data
- **Testing Focus**:
  - Sync failures and recovery
  - Duplicate event handling
  - Large calendar syncs
  - OAuth token expiration
  - Partial sync failures

#### **4. Recurring Events & Exceptions**
- **Risk**: Incorrect recurrence calculation or exception handling
- **Why Critical**: Complex logic prone to edge cases
- **Testing Focus**:
  - Recurrence pattern calculations
  - Exception creation and modification
  - Series updates (this/future/all)
  - Timezone handling in recurrences
  - End date boundary conditions

#### **5. Concurrent Data Modifications**
- **Risk**: Race conditions leading to data inconsistency
- **Why Critical**: Multiple family members can modify data simultaneously
- **Testing Focus**:
  - Simultaneous event updates
  - Concurrent child profile modifications
  - Parallel invitation acceptance
  - Family deletion during active operations

#### **6. OAuth & Authentication**
- **Risk**: Authentication failures or token management issues
- **Why Critical**: Users cannot access the application
- **Testing Focus**:
  - Token expiration handling
  - Refresh token flow
  - OAuth callback failures
  - Session persistence
  - Multiple device scenarios

#### **7. Data Migration & Schema Changes**
- **Risk**: Data loss or corruption during migrations
- **Why Critical**: Production data integrity
- **Testing Focus**:
  - Migration rollback scenarios
  - Data transformation accuracy
  - Index creation impact
  - Foreign key constraint handling

#### **8. Mobile Responsiveness**
- **Risk**: Poor mobile experience affecting user adoption
- **Why Critical**: Mobile-first design is a core requirement
- **Testing Focus**:
  - Touch target sizes
  - Form interactions on mobile
  - Calendar view responsiveness
  - Navigation patterns
  - Performance on low-end devices

</project_analysis>

## <test_plan>

# Test Plan - Home Planner Application

## 1. Introduction and Testing Objectives

### 1.1 Purpose
This test plan outlines the comprehensive testing strategy for the Home Planner application, a family calendar coordination system. The plan ensures that all features, integrations, and user flows are thoroughly validated before production deployment.

### 1.2 Scope
This test plan covers:
- All functional features defined in the MVP scope
- Security and authorization mechanisms
- External integrations (Google Calendar, Microsoft 365)
- User interface and user experience
- Performance and scalability
- Data integrity and consistency

### 1.3 Testing Objectives
1. **Functional Correctness**: Verify all features work as specified
2. **Security**: Ensure data privacy and proper access controls
3. **Reliability**: Validate system stability under various conditions
4. **Usability**: Confirm intuitive user experience across devices
5. **Performance**: Ensure acceptable response times and resource usage
6. **Compatibility**: Verify cross-browser and cross-device functionality
7. **Integration**: Validate external calendar synchronization
8. **Data Integrity**: Ensure accurate data storage and retrieval

### 1.4 Document Control
- **Version**: 1.0
- **Date**: 2025-01-XX
- **Author**: QA Team
- **Review Status**: Draft

## 2. Test Scope

### 2.1 In-Scope Testing

#### **Functional Testing**
- User authentication and authorization
- Family management (create, update, delete)
- Member management (invite, remove, role changes)
- Child profile management (CRUD operations)
- Event management (create, read, update, delete)
- Event conflict detection and validation
- Recurring events (daily, weekly, monthly)
- Event exceptions (modify/cancel individual occurrences)
- Calendar views (Day, Week, Month, Agenda)
- Event filtering by participant
- External calendar integration (Google, Microsoft 365)
- Calendar synchronization
- Onboarding flow (all steps)
- User profile management
- Audit logging

#### **Non-Functional Testing**
- Security testing (authorization, authentication, RLS policies)
- Performance testing (API response times, page load times)
- Usability testing (mobile responsiveness, accessibility)
- Compatibility testing (browsers, devices)
- Integration testing (external APIs, database)
- Error handling and edge cases

### 2.2 Out-of-Scope Testing
- Two-way calendar synchronization (future feature)
- Advanced notification system (future feature)
- Native mobile applications (out of scope for MVP)
- Load testing at enterprise scale (not required for MVP)
- Penetration testing (separate security audit)
- Internationalization (i18n) - English only for MVP

### 2.3 Test Environment Requirements
- **Development Environment**: Local development with in-memory database
- **Staging Environment**: Supabase staging project with test data
- **Production-like Environment**: Supabase production project (read-only testing)

## 3. Types of Tests to be Performed

### 3.1 Unit Tests
**Purpose**: Test individual components, services, and functions in isolation

**Coverage Areas**:
- Service layer logic (EventService, FamilyService, ChildService, etc.)
- Repository implementations (SQL and in-memory)
- Utility functions and helpers
- Domain entities and value objects
- Validation logic (Zod schemas)
- Error handling

**Tools**: Vitest
**Target Coverage**: Minimum 80% code coverage

**Key Test Cases**:
- Service method success scenarios
- Service method error scenarios (validation, not found, forbidden)
- Repository CRUD operations
- Business rule validation
- Data transformation logic

### 3.2 Integration Tests
**Purpose**: Test interactions between components and external systems

**Coverage Areas**:
- API endpoint handlers
- Repository-to-database interactions
- Service-to-repository interactions
- Middleware execution
- Authentication flow
- External API integrations (mocked)

**Tools**: Vitest with test database
**Target Coverage**: All API endpoints

**Key Test Cases**:
- API request/response cycles
- Database transaction handling
- RLS policy enforcement
- Error propagation through layers
- Authentication middleware
- Repository factory and dependency injection

### 3.3 End-to-End Tests
**Purpose**: Test complete user workflows from UI to database

**Coverage Areas**:
- Onboarding flow (complete journey)
- Event creation and management
- Family management workflows
- Calendar view interactions
- External calendar connection flow
- Member invitation and acceptance flow

**Tools**: Playwright
**Target Coverage**: All critical user journeys

**Key Test Cases**:
- Complete onboarding flow
- Create event with various configurations
- Update recurring event series
- Connect external calendar
- Invite and accept family member
- Filter calendar by participant
- Switch between calendar views

### 3.4 Security Tests
**Purpose**: Validate security mechanisms and access controls

**Coverage Areas**:
- Authentication mechanisms
- Authorization checks (family membership, roles)
- RLS policy enforcement
- Input validation and sanitization
- Token handling and expiration
- Cross-family data access prevention

**Tools**: Vitest, Playwright, Manual testing
**Target Coverage**: All security-critical paths

**Key Test Cases**:
- Unauthorized access attempts
- Cross-family data access attempts
- Role escalation attempts
- Invalid token handling
- SQL injection prevention
- XSS prevention
- CSRF protection

### 3.5 Performance Tests
**Purpose**: Validate system performance under normal load

**Coverage Areas**:
- API response times
- Page load times
- Database query performance
- Calendar rendering performance
- Large dataset handling

**Tools**: Playwright, Custom scripts
**Target Coverage**: Critical user paths

**Key Test Cases**:
- API endpoint response times (< 500ms)
- Calendar view rendering with 100+ events
- Large family data loading
- External calendar sync performance
- Concurrent user operations

### 3.6 Usability Tests
**Purpose**: Validate user experience and interface design

**Coverage Areas**:
- Mobile responsiveness
- Touch target sizes
- Form interactions
- Navigation patterns
- Accessibility (WCAG 2.1 AA)
- Error message clarity

**Tools**: Manual testing, Playwright, Accessibility tools
**Target Coverage**: All user-facing features

**Key Test Cases**:
- Mobile view rendering (320px - 768px)
- Form validation feedback
- Error message display
- Keyboard navigation
- Screen reader compatibility
- Color contrast compliance

### 3.7 Compatibility Tests
**Purpose**: Ensure application works across different browsers and devices

**Coverage Areas**:
- Desktop browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Different screen sizes
- Operating systems

**Tools**: Playwright, BrowserStack (if available)
**Target Coverage**: Primary browsers

**Key Test Cases**:
- Cross-browser functionality
- Mobile device testing
- Responsive design validation
- Feature detection and fallbacks

## 4. Test Scenarios for Key Functionalities

### 4.1 Authentication & Authorization

#### **TC-AUTH-001: Google OAuth Sign-In**
- **Preconditions**: User has Google account
- **Steps**:
  1. Navigate to login page
  2. Click "Sign in with Google"
  3. Complete Google OAuth flow
  4. Verify redirect to application
- **Expected**: User is authenticated and redirected to onboarding or dashboard
- **Priority**: P0

#### **TC-AUTH-002: Token Expiration Handling**
- **Preconditions**: User has valid session
- **Steps**:
  1. Wait for token expiration
  2. Perform API request
  3. Verify token refresh
- **Expected**: Token is automatically refreshed, user remains authenticated
- **Priority**: P0

#### **TC-AUTH-003: Unauthorized Access Attempt**
- **Preconditions**: No valid session
- **Steps**:
  1. Attempt to access protected API endpoint without token
  2. Verify response
- **Expected**: 401 Unauthorized response
- **Priority**: P0

#### **TC-AUTH-004: Cross-Family Data Access**
- **Preconditions**: User belongs to Family A, attempts to access Family B data
- **Steps**:
  1. Authenticate as User A (member of Family A)
  2. Attempt to access Family B events via API
- **Expected**: 403 Forbidden response
- **Priority**: P0

### 4.2 Family Management

#### **TC-FAM-001: Create Family**
- **Preconditions**: User is authenticated
- **Steps**:
  1. Navigate to onboarding or family creation
  2. Enter family name
  3. Submit form
- **Expected**: Family created, user added as admin, redirected to next step
- **Priority**: P0

#### **TC-FAM-002: Update Family Name (Admin)**
- **Preconditions**: User is admin of family
- **Steps**:
  1. Navigate to family settings
  2. Update family name
  3. Save changes
- **Expected**: Family name updated, audit log created
- **Priority**: P1

#### **TC-FAM-003: Update Family Name (Member)**
- **Preconditions**: User is member (not admin) of family
- **Steps**:
  1. Navigate to family settings
  2. Attempt to update family name
- **Expected**: 403 Forbidden or UI prevents action
- **Priority**: P0

#### **TC-FAM-004: Delete Family**
- **Preconditions**: User is admin, family has members and events
- **Steps**:
  1. Navigate to family settings
  2. Delete family
  3. Confirm deletion
- **Expected**: Family and all related data deleted (cascade), audit log created
- **Priority**: P1

### 4.3 Member Management

#### **TC-MEM-001: Invite Family Member**
- **Preconditions**: User is member of family
- **Steps**:
  1. Navigate to member management
  2. Enter invitee email
  3. Send invitation
- **Expected**: Invitation created, email sent (or mocked), invitation appears in list
- **Priority**: P0

#### **TC-MEM-002: Accept Invitation**
- **Preconditions**: Invitation exists, user is authenticated
- **Steps**:
  1. Click invitation link or navigate to invitation page
  2. Accept invitation
- **Expected**: User added to family as member, invitation status updated
- **Priority**: P0

#### **TC-MEM-003: Expired Invitation**
- **Preconditions**: Invitation exists and is expired
- **Steps**:
  1. Attempt to accept expired invitation
- **Expected**: Error message displayed, invitation cannot be accepted
- **Priority**: P1

#### **TC-MEM-004: Update Member Role (Admin)**
- **Preconditions**: User is admin, target user is member
- **Steps**:
  1. Navigate to member management
  2. Change member role to admin
  3. Save changes
- **Expected**: Role updated, audit log created
- **Priority**: P1

### 4.4 Child Profile Management

#### **TC-CHILD-001: Create Child Profile**
- **Preconditions**: User is member of family
- **Steps**:
  1. Navigate to children management
  2. Add child with name
  3. Save
- **Expected**: Child profile created, appears in list, audit log created
- **Priority**: P0

#### **TC-CHILD-002: Update Child Profile**
- **Preconditions**: Child exists in family
- **Steps**:
  1. Navigate to children management
  2. Edit child name
  3. Save changes
- **Expected**: Child profile updated, audit log created
- **Priority**: P1

#### **TC-CHILD-003: Delete Child Profile**
- **Preconditions**: Child exists, may have associated events
- **Steps**:
  1. Navigate to children management
  2. Delete child
  3. Confirm deletion
- **Expected**: Child deleted, associated event participants handled, audit log created
- **Priority**: P1

#### **TC-CHILD-004: List Children**
- **Preconditions**: Family has multiple children
- **Steps**:
  1. Navigate to children management
  2. View children list
- **Expected**: All children displayed, ordered by creation date
- **Priority**: P1

### 4.5 Event Management

#### **TC-EVT-001: Create Elastic Event**
- **Preconditions**: User is member of family
- **Steps**:
  1. Navigate to calendar
  2. Click create event
  3. Fill event details (title, time, participants)
  4. Set type to "elastic"
  5. Save event
- **Expected**: Event created, appears in calendar, audit log created
- **Priority**: P0

#### **TC-EVT-002: Create Blocker Event**
- **Preconditions**: User is member of family
- **Steps**:
  1. Navigate to calendar
  2. Create event with type "blocker"
  3. Save event
- **Expected**: Event created as blocker, conflict detection active
- **Priority**: P0

#### **TC-EVT-003: Create Recurring Event (Daily)**
- **Preconditions**: User is member of family
- **Steps**:
  1. Create event
  2. Enable recurrence
  3. Set frequency to daily, end date
  4. Save event
- **Expected**: Event series created, all occurrences visible in calendar
- **Priority**: P0

#### **TC-EVT-004: Create Recurring Event (Weekly)**
- **Preconditions**: User is member of family
- **Steps**:
  1. Create event
  2. Enable recurrence
  3. Set frequency to weekly, interval, end date
  4. Save event
- **Expected**: Weekly event series created correctly
- **Priority**: P0

#### **TC-EVT-005: Create Recurring Event (Monthly)**
- **Preconditions**: User is member of family
- **Steps**:
  1. Create event
  2. Enable recurrence
  3. Set frequency to monthly, end date
  4. Save event
- **Expected**: Monthly event series created correctly
- **Priority**: P0

#### **TC-EVT-006: Update Single Event Occurrence**
- **Preconditions**: Recurring event exists
- **Steps**:
  1. Select specific occurrence
  2. Modify time or details
  3. Choose "this occurrence only"
  4. Save
- **Expected**: Exception created, only selected occurrence modified
- **Priority**: P0

#### **TC-EVT-007: Update Future Occurrences**
- **Preconditions**: Recurring event exists with past and future occurrences
- **Steps**:
  1. Select occurrence
  2. Modify details
  3. Choose "this and future occurrences"
  4. Save
- **Expected**: Exception created, future occurrences updated, past unchanged
- **Priority**: P0

#### **TC-EVT-008: Update All Occurrences**
- **Preconditions**: Recurring event exists
- **Steps**:
  1. Select occurrence
  2. Modify details
  3. Choose "all occurrences"
  4. Save
- **Expected**: Base event updated, all occurrences reflect changes
- **Priority**: P0

#### **TC-EVT-009: Delete Single Occurrence**
- **Preconditions**: Recurring event exists
- **Steps**:
  1. Select occurrence
  2. Delete
  3. Choose "this occurrence only"
- **Expected**: Exception created marking occurrence as cancelled
- **Priority**: P1

#### **TC-EVT-010: Event Conflict Detection - Blocker vs Blocker**
- **Preconditions**: Blocker event exists for participant
- **Steps**:
  1. Create new blocker event with overlapping time for same participant
  2. Attempt to save
- **Expected**: Conflict warning displayed, event creation prevented or allowed with warning
- **Priority**: P0

#### **TC-EVT-011: Event Conflict Detection - Blocker vs Elastic**
- **Preconditions**: Blocker event exists
- **Steps**:
  1. Create elastic event with overlapping time
- **Expected**: Conflict warning displayed, elastic event can be created
- **Priority**: P1

#### **TC-EVT-012: Event Conflict Detection - Multiple Participants**
- **Preconditions**: Multiple participants exist
- **Steps**:
  1. Create event with participants A and B
  2. Create overlapping event with participants B and C
- **Expected**: Conflict detected for participant B
- **Priority**: P0

#### **TC-EVT-013: All-Day Event**
- **Preconditions**: User is member of family
- **Steps**:
  1. Create event
  2. Enable "all-day" option
  3. Save event
- **Expected**: Event displayed as all-day, no time conflicts with timed events
- **Priority**: P1

#### **TC-EVT-014: Event Validation - End Before Start**
- **Preconditions**: User is member of family
- **Steps**:
  1. Create event
  2. Set end time before start time
  3. Attempt to save
- **Expected**: Validation error displayed, event not created
- **Priority**: P0

### 4.6 Calendar Views

#### **TC-CAL-001: Day View Display**
- **Preconditions**: Events exist for selected day
- **Steps**:
  1. Navigate to calendar
  2. Select Day view
  3. Navigate to specific day
- **Expected**: All events for selected day displayed in timeline format
- **Priority**: P0

#### **TC-CAL-002: Week View Display**
- **Preconditions**: Events exist for selected week
- **Steps**:
  1. Navigate to calendar
  2. Select Week view
  3. Navigate to specific week
- **Expected**: All events for week displayed in grid format
- **Priority**: P0

#### **TC-CAL-003: Month View Display**
- **Preconditions**: Events exist for selected month
- **Steps**:
  1. Navigate to calendar
  2. Select Month view
  3. Navigate to specific month
- **Expected**: Month grid displayed with event indicators
- **Priority**: P0

#### **TC-CAL-004: Agenda View Display**
- **Preconditions**: Upcoming events exist
- **Steps**:
  1. Navigate to calendar
  2. Select Agenda view
- **Expected**: List of upcoming events displayed chronologically
- **Priority**: P0

#### **TC-CAL-005: Filter by Participant**
- **Preconditions**: Multiple events with different participants exist
- **Steps**:
  1. Navigate to calendar
  2. Select participant filter
  3. Choose specific participant
- **Expected**: Only events for selected participant displayed
- **Priority**: P0

#### **TC-CAL-006: Date Navigation**
- **Preconditions**: User is on calendar page
- **Steps**:
  1. Use date navigation controls
  2. Navigate forward/backward
  3. Jump to today
- **Expected**: Calendar view updates to selected date range
- **Priority**: P1

### 4.7 External Calendar Integration

#### **TC-EXT-001: Connect Google Calendar**
- **Preconditions**: User is authenticated
- **Steps**:
  1. Navigate to external calendars settings
  2. Click "Connect Google Calendar"
  3. Complete OAuth flow
  4. Authorize access
- **Expected**: Calendar connected, appears in list, initial sync triggered
- **Priority**: P0

#### **TC-EXT-002: Connect Microsoft 365 Calendar**
- **Preconditions**: User is authenticated
- **Steps**:
  1. Navigate to external calendars settings
  2. Click "Connect Microsoft 365"
  3. Complete OAuth flow
  4. Authorize access
- **Expected**: Calendar connected, appears in list, initial sync triggered
- **Priority**: P0

#### **TC-EXT-003: Manual Calendar Sync**
- **Preconditions**: External calendar is connected
- **Steps**:
  1. Navigate to external calendars settings
  2. Click "Sync Now" for calendar
- **Expected**: Sync process starts, events imported, sync status updated
- **Priority**: P0

#### **TC-EXT-004: Automatic Calendar Sync**
- **Preconditions**: External calendar is connected
- **Steps**:
  1. Wait for automatic sync interval
  2. Verify sync occurred
- **Expected**: Events synchronized automatically, sync status updated
- **Priority**: P1

#### **TC-EXT-005: Sync Failure Handling**
- **Preconditions**: External calendar is connected, OAuth token expired
- **Steps**:
  1. Attempt manual sync
- **Expected**: Error message displayed, sync status set to "error", reconnection option provided
- **Priority**: P0

#### **TC-EXT-006: Disconnect External Calendar**
- **Preconditions**: External calendar is connected
- **Steps**:
  1. Navigate to external calendars settings
  2. Disconnect calendar
  3. Confirm disconnection
- **Expected**: Calendar disconnected, synced events remain but marked as disconnected
- **Priority**: P1

### 4.8 Onboarding Flow

#### **TC-ONB-001: Complete Onboarding Flow**
- **Preconditions**: New user authenticated
- **Steps**:
  1. Complete welcome step (create family)
  2. Connect calendar (optional, can skip)
  3. Add children
  4. Invite members (optional, can skip)
  5. Complete onboarding
- **Expected**: All steps completed, user redirected to calendar
- **Priority**: P0

#### **TC-ONB-002: Skip Optional Steps**
- **Preconditions**: New user authenticated
- **Steps**:
  1. Complete welcome step
  2. Skip calendar connection
  3. Skip adding children
  4. Skip inviting members
  5. Complete onboarding
- **Expected**: Onboarding completed with minimal data
- **Priority**: P0

#### **TC-ONB-003: Onboarding Progress Persistence**
- **Preconditions**: User started onboarding
- **Steps**:
  1. Complete step 1
  2. Close browser
  3. Return to application
- **Expected**: Onboarding resumes from last completed step
- **Priority**: P1

#### **TC-ONB-004: Back Navigation in Onboarding**
- **Preconditions**: User on step 3 of onboarding
- **Steps**:
  1. Click back button
  2. Modify step 2 data
  3. Continue forward
- **Expected**: Data preserved, can navigate back and forth
- **Priority**: P1

### 4.9 Error Handling & Edge Cases

#### **TC-ERR-001: Network Failure During API Call**
- **Preconditions**: User performing action requiring API call
- **Steps**:
  1. Simulate network failure
  2. Attempt action
- **Expected**: Error message displayed, user can retry
- **Priority**: P1

#### **TC-ERR-002: Invalid Input Validation**
- **Preconditions**: User filling form
- **Steps**:
  1. Enter invalid data (empty required fields, invalid formats)
  2. Submit form
- **Expected**: Validation errors displayed, form not submitted
- **Priority**: P0

#### **TC-ERR-003: Concurrent Event Updates**
- **Preconditions**: Two users viewing same event
- **Steps**:
  1. User A starts editing event
  2. User B simultaneously edits same event
  3. Both save
- **Expected**: Last write wins or conflict resolution message
- **Priority**: P1

#### **TC-ERR-004: Large Dataset Handling**
- **Preconditions**: Family has 100+ events
- **Steps**:
  1. Load calendar view
  2. Navigate through dates
- **Expected**: Calendar loads and renders within acceptable time
- **Priority**: P1

#### **TC-ERR-005: Timezone Handling**
- **Preconditions**: User in different timezone
- **Steps**:
  1. Create event
  2. View event from different timezone
- **Expected**: Event times displayed correctly in user's local timezone
- **Priority**: P0

## 5. Test Environment

### 5.1 Test Environment Setup

#### **Development Environment**
- **Purpose**: Local development and unit testing
- **Database**: In-memory (for unit tests) or local Supabase instance
- **Configuration**: `.env.local` with test credentials
- **Access**: Developers only

#### **Staging Environment**
- **Purpose**: Integration and E2E testing
- **Database**: Supabase staging project
- **Configuration**: Staging environment variables
- **Access**: QA team, developers
- **Data**: Test data, can be reset as needed

#### **Production-like Environment**
- **Purpose**: Final validation before release
- **Database**: Supabase production project (read-only for testing)
- **Configuration**: Production environment variables
- **Access**: QA team lead only
- **Data**: Production data (read-only)

### 5.2 Test Data Management

#### **Test Data Requirements**
- **Families**: Multiple test families with various configurations
- **Users**: Test users with different roles (admin, member)
- **Children**: Test child profiles
- **Events**: Various event types, recurring patterns, conflicts
- **External Calendars**: Mocked external calendar data

#### **Test Data Reset Strategy**
- **Unit Tests**: Fresh data for each test (in-memory repositories)
- **Integration Tests**: Database reset before test suite
- **E2E Tests**: Test data cleanup after each test run
- **Staging Environment**: Weekly reset with seed data

### 5.3 Environment Variables

#### **Required Variables**
```
PUBLIC_SUPABASE_URL=<staging-url>
PUBLIC_SUPABASE_ANON_KEY=<staging-key>
TEST_ENV=mock|staging|production
FRONTEND_URL=http://localhost:4321
```

## 6. Testing Tools

### 6.1 Unit Testing Tools

#### **Vitest**
- **Purpose**: Unit and integration testing
- **Configuration**: `vitest.config.ts`
- **Coverage**: `@vitest/coverage-v8`
- **Usage**: `pnpm test`, `pnpm test:coverage`

#### **Key Features**
- Fast test execution
- TypeScript support
- Code coverage reporting
- Mock capabilities
- Snapshot testing

### 6.2 E2E Testing Tools

#### **Playwright**
- **Purpose**: End-to-end testing
- **Configuration**: `playwright.config.ts`
- **Browsers**: Chromium (primary), can extend to Firefox/Safari
- **Usage**: `pnpm test:e2e`, `pnpm test:e2e:ui`

#### **Key Features**
- Cross-browser testing
- Mobile emulation
- Network interception
- Screenshot/video on failure
- Parallel test execution

### 6.3 Test Utilities and Helpers

#### **Test Fixtures**
- **Location**: `e2e/fixtures/`
- **Files**: `auth.ts`, `helpers.ts`
- **Purpose**: Reusable test setup and utilities

#### **Mock Data**
- **In-Memory Repositories**: For unit testing
- **OAuth Mocking**: For E2E testing
- **External API Mocking**: For integration testing

### 6.4 Additional Tools

#### **Code Quality**
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **TypeScript**: Type checking

#### **Coverage Reporting**
- **Vitest Coverage**: Code coverage reports
- **HTML Reports**: Visual coverage reports

## 7. Test Schedule

### 7.1 Testing Phases

#### **Phase 1: Unit Testing (Week 1-2)**
- **Duration**: 2 weeks
- **Focus**: Service layer, repositories, utilities
- **Deliverable**: 80%+ code coverage
- **Team**: Developers

#### **Phase 2: Integration Testing (Week 3)**
- **Duration**: 1 week
- **Focus**: API endpoints, database interactions
- **Deliverable**: All API endpoints tested
- **Team**: Developers + QA

#### **Phase 3: E2E Testing (Week 4-5)**
- **Duration**: 2 weeks
- **Focus**: Complete user journeys
- **Deliverable**: All critical paths tested
- **Team**: QA team

#### **Phase 4: Security Testing (Week 5)**
- **Duration**: 1 week (parallel with E2E)
- **Focus**: Authorization, RLS policies, security vulnerabilities
- **Deliverable**: Security test report
- **Team**: QA + Security review

#### **Phase 5: Performance Testing (Week 6)**
- **Duration**: 1 week
- **Focus**: API performance, page load times
- **Deliverable**: Performance test report
- **Team**: QA team

#### **Phase 6: Usability Testing (Week 6)**
- **Duration**: 1 week (parallel with performance)
- **Focus**: Mobile responsiveness, accessibility
- **Deliverable**: Usability test report
- **Team**: QA + UX team

#### **Phase 7: Regression Testing (Week 7)**
- **Duration**: 1 week
- **Focus**: Re-testing after bug fixes
- **Deliverable**: Regression test report
- **Team**: QA team

### 7.2 Test Execution Schedule

#### **Daily**
- Unit tests run on every commit (CI/CD)
- Integration tests run on every PR

#### **Weekly**
- Full E2E test suite execution
- Security test execution
- Performance baseline checks

#### **Pre-Release**
- Complete test suite execution
- Regression testing
- Final validation

## 8. Test Acceptance Criteria

### 8.1 Functional Acceptance Criteria

#### **Must Pass**
- ✅ All P0 test cases pass (100%)
- ✅ All P1 test cases pass (95%+)
- ✅ No critical bugs (P0 severity)
- ✅ All API endpoints return correct status codes
- ✅ All user journeys complete successfully
- ✅ Data integrity maintained in all operations

#### **Should Pass**
- ✅ All P2 test cases pass (90%+)
- ✅ Performance benchmarks met
- ✅ Accessibility standards met (WCAG 2.1 AA)
- ✅ Cross-browser compatibility verified

### 8.2 Non-Functional Acceptance Criteria

#### **Performance**
- ✅ API response times < 500ms (95th percentile)
- ✅ Page load times < 2 seconds
- ✅ Calendar rendering with 100+ events < 3 seconds
- ✅ No memory leaks during extended use

#### **Security**
- ✅ All authorization checks pass
- ✅ RLS policies enforced correctly
- ✅ No unauthorized data access possible
- ✅ Input validation prevents injection attacks
- ✅ Token handling secure

#### **Usability**
- ✅ Mobile responsive on 320px - 768px screens
- ✅ Touch targets minimum 44x44px
- ✅ Keyboard navigation functional
- ✅ Screen reader compatible
- ✅ Error messages clear and actionable

#### **Compatibility**
- ✅ Chrome (latest 2 versions)
- ✅ Firefox (latest 2 versions)
- ✅ Safari (latest 2 versions)
- ✅ Edge (latest 2 versions)
- ✅ iOS Safari (latest 2 versions)
- ✅ Chrome Mobile (latest 2 versions)

### 8.3 Code Quality Acceptance Criteria

#### **Coverage**
- ✅ Unit test coverage ≥ 80%
- ✅ Integration test coverage ≥ 70%
- ✅ Critical paths 100% covered

#### **Code Standards**
- ✅ All ESLint rules pass
- ✅ TypeScript compilation without errors
- ✅ No console errors in production build

## 9. Roles and Responsibilities

### 9.1 Testing Team Structure

#### **QA Lead**
- **Responsibilities**:
  - Test plan creation and maintenance
  - Test strategy definition
  - Test execution coordination
  - Bug triage and prioritization
  - Test reporting to stakeholders
- **Skills**: Test planning, test management, communication

#### **QA Engineers**
- **Responsibilities**:
  - Test case creation and execution
  - Bug identification and reporting
  - Test automation development
  - Test data preparation
  - Test environment setup
- **Skills**: Testing tools, automation, attention to detail

#### **Developers**
- **Responsibilities**:
  - Unit test creation
  - Integration test creation
  - Bug fixing
  - Code review with test perspective
  - Test infrastructure development
- **Skills**: Programming, testing, debugging

#### **Product Owner**
- **Responsibilities**:
  - Acceptance criteria definition
  - Test priority clarification
  - Feature validation
  - Release decision support
- **Skills**: Product knowledge, decision making

### 9.2 Collaboration Model

#### **Daily Standups**
- Test progress updates
- Blockers identification
- Test execution coordination

#### **Sprint Planning**
- Test effort estimation
- Test case assignment
- Test environment requirements

#### **Bug Triage**
- Weekly bug review meetings
- Priority assignment
- Resolution planning

#### **Test Reviews**
- Test case review before execution
- Test result review
- Test coverage review

## 10. Bug Reporting Procedures

### 10.1 Bug Classification

#### **Severity Levels**

**P0 - Critical**
- **Definition**: Application crash, data loss, security vulnerability, complete feature failure
- **Examples**: Cannot login, data corruption, unauthorized access
- **Response Time**: Immediate
- **Resolution Time**: Within 24 hours

**P1 - High**
- **Definition**: Major feature malfunction, significant usability issue
- **Examples**: Event creation fails, calendar not loading, incorrect conflict detection
- **Response Time**: Within 4 hours
- **Resolution Time**: Within 3 days

**P2 - Medium**
- **Definition**: Minor feature issue, cosmetic problem, workaround available
- **Examples**: UI alignment issues, minor validation problems
- **Response Time**: Within 1 day
- **Resolution Time**: Within 1 week

**P3 - Low**
- **Definition**: Cosmetic issues, enhancement requests, minor inconveniences
- **Examples**: Text typos, color adjustments, nice-to-have features
- **Response Time**: Within 3 days
- **Resolution Time**: Next release

### 10.2 Bug Report Template

#### **Required Fields**
```
Title: [Brief description of the issue]

Severity: [P0/P1/P2/P3]

Priority: [Critical/High/Medium/Low]

Component: [Authentication/Events/Calendar/Family/etc.]

Environment:
- Browser: [Chrome/Firefox/Safari/Edge]
- Version: [Browser version]
- OS: [Windows/Mac/Linux/iOS/Android]
- Device: [Desktop/Mobile/Tablet]
- Screen Size: [Resolution]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Expected Result:
[What should happen]

Actual Result:
[What actually happens]

Screenshots/Videos:
[Attach if applicable]

Console Errors:
[Any browser console errors]

Network Logs:
[Any relevant network request/response]

Additional Context:
[Any other relevant information]
```

### 10.3 Bug Tracking Workflow

#### **Bug Lifecycle**
1. **New**: Bug reported, awaiting triage
2. **Assigned**: Bug assigned to developer
3. **In Progress**: Developer working on fix
4. **Fixed**: Fix implemented, awaiting verification
5. **Verified**: QA verified fix, bug closed
6. **Reopened**: Bug still exists after fix
7. **Closed**: Bug resolved and verified

#### **Bug Triage Process**
1. **Initial Review**: QA Lead reviews all new bugs
2. **Severity Assignment**: Severity and priority assigned
3. **Assignment**: Bug assigned to appropriate developer
4. **Tracking**: Bug tracked in project management tool
5. **Updates**: Regular status updates during resolution

### 10.4 Bug Verification Process

#### **Verification Steps**
1. **Reproduce**: QA reproduces bug in original environment
2. **Verify Fix**: QA verifies fix in test environment
3. **Regression**: QA checks for regression in related areas
4. **Documentation**: Update test cases if needed
5. **Closure**: Bug marked as verified and closed

#### **Reopening Criteria**
- Bug still occurs after fix
- Fix introduces new bugs
- Fix doesn't address root cause
- Fix causes regression

### 10.5 Test Reporting

#### **Daily Test Reports**
- Tests executed count
- Tests passed/failed count
- Bugs found count
- Blockers identified

#### **Weekly Test Summary**
- Test progress against plan
- Test coverage metrics
- Bug trends and analysis
- Risk assessment

#### **Release Test Report**
- Test execution summary
- Test coverage report
- Bug summary and resolution
- Release readiness assessment
- Known issues and limitations

---

## Appendix A: Test Case Traceability Matrix

| Feature | Unit Tests | Integration Tests | E2E Tests | Security Tests |
|---------|-----------|------------------|-----------|----------------|
| Authentication | ✅ | ✅ | ✅ | ✅ |
| Family Management | ✅ | ✅ | ✅ | ✅ |
| Member Management | ✅ | ✅ | ✅ | ✅ |
| Child Management | ✅ | ✅ | ✅ | ✅ |
| Event Management | ✅ | ✅ | ✅ | ✅ |
| Calendar Views | ❌ | ✅ | ✅ | ❌ |
| External Calendars | ✅ | ✅ | ✅ | ✅ |
| Onboarding | ❌ | ✅ | ✅ | ❌ |

## Appendix B: Risk Assessment Matrix

| Risk | Probability | Impact | Mitigation | Test Focus |
|------|-----------|--------|------------|------------|
| Security vulnerabilities | Medium | High | Security testing, code review | Authorization, RLS, input validation |
| Data loss | Low | High | Backup strategy, transaction handling | Data integrity tests |
| Performance issues | Medium | Medium | Performance testing, optimization | Load tests, response time tests |
| Integration failures | Medium | High | Mocking, error handling | External API tests |
| Browser compatibility | Low | Medium | Cross-browser testing | Compatibility tests |

## Appendix C: Test Data Scenarios

### Scenario 1: Small Family
- 1 admin, 1 member
- 2 children
- 10 events (mix of elastic and blocker)
- 1 external calendar

### Scenario 2: Large Family
- 1 admin, 3 members
- 5 children
- 100+ events (including recurring)
- 2 external calendars

### Scenario 3: Conflict Scenarios
- Multiple overlapping blocker events
- Elastic events overlapping with blockers
- Recurring events with conflicts

### Scenario 4: Edge Cases
- Empty family
- Family with no events
- Events spanning multiple days
- All-day events
- Events in different timezones

---

**Document End**
