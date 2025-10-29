# Product Requirements Document (PRD) - Home Planner

## 1. Product Overview

The Home Planner is a web application designed to help families better coordinate and plan their schedules. It provides a centralized, shared calendar system that integrates with popular calendar services, accounts for both fixed commitments and flexible time slots, and supports the management of multiple family members' schedules. The goal is to improve planning and coordination of family activities and tasks, reducing scheduling conflicts.

## 2. User Problem

Families face challenges in coordinating schedules for children's activities and adult work commitments. Children have regular kindergarten and extra lessons (both recurring and random). Adults have different work hours with both non-negotiable meetings (hard blocks) and flexible work time (soft blocks). The current reliance on manual or paper calendars makes sharing and synchronization difficult, leading to scheduling conflicts and planning inefficiencies. A centralized system is needed to manage these complex, interdependent schedules.

## 3. Functional Requirements

### 3.1. User and Family Management

- The system will be built around a "family" unit.
- An "Admin/Parent" account will manage the family, including creating and managing profiles for children. Children will not have their own accounts.
- The Admin can invite other adult "Members" to the family.
- All adult "Members" have permission to create and update events for all family members, including children.
- Authentication will be handled by Supabase, with "Sign in with Google" as the primary method.

### 3.2. Core Calendar Functionality

- The application will feature a comprehensive, responsive calendar.
- It must support Daily, Weekly, Monthly, and Agenda views.
- All views must be fully responsive and optimized for both desktop and mobile use.
- Users can filter the calendar to see events for specific family members.
- All event times will be stored in UTC on the backend and rendered in the user's local time zone on the frontend.
- Multi-day events will be displayed as a banner at the top of the calendar view.
- A separate section for "all-day" events will be provided.

### 3.3. Event Management

- Users can create events with a title, start/end time, and participants.
- There is no functional difference between "tasks" and "events"; they are a single entity and will not have a completion state (e.g., 'to-do', 'done').
- Events are categorized as either "Elastic" or "Blocker".
- The system will support recurring events with common patterns: daily, weekly, and monthly, with a required end date.
- When editing a recurring event, users will have two choices: "Edit only this event" or "Edit all future events."
- The "participants" field will serve as a visual label to indicate who is involved in an event, without triggering notifications.

### 3.4. Conflict Resolution

- "Blocker" events are rigid and cannot be scheduled over an existing "Blocker" event. The UI will prevent saving a conflicting "Blocker" event and display a clear, in-line error message.
- "Elastic" events are flexible and can be overlapped with any other event type.
- The system must check for overlaps when creating events and syncing external calendars, and notify the user of conflicts.

### 3.5. External Calendar Integration

- The MVP will support one-way, read-only synchronization with Google Calendar and Microsoft 365 Calendar.
- Users can connect multiple calendar accounts.
- Events synced from external calendars are strictly read-only within the application.
- To protect privacy, externally synced events will appear as "Busy" by default to other family members. The calendar owner has the option to make specific events fully visible.
- Sync will occur periodically (e.g., every 15 minutes) and can be triggered manually via a "Refresh" button.

### 3.6. Onboarding

- A step-by-step wizard will guide new users through the initial setup process, including account creation, connecting their first calendar, and inviting family members.

## 4. Product Boundaries

### 4.1. In Scope for MVP

- User authentication via "Sign in with Google".
- Family creation and management of adult members and child profiles.
- Core calendar with Day, Week, Month, and Agenda views.
- Creation and management of "Elastic" and "Blocker" events.
- Support for basic recurring events (daily, weekly, monthly).
- Read-only, one-way sync with Google Calendar and Microsoft 365 Calendar.
- Filtering calendar views by family member.
- Responsive design for desktop and mobile browsers.
- Onboarding wizard for new users.

### 4.2. Out of Scope for MVP

- Two-way synchronization with external calendars.
- Advanced notification system beyond conflict alerts and event reminders.
- Completion states for tasks/events (e.g., 'to-do', 'in progress', 'done').
- Advanced recurrence options (e.g., every other Tuesday).
- Native mobile applications (iOS/Android).
- File attachments or detailed notes for events beyond the title.
- Public sharing of calendars.
- Budgeting or resource management features.

## 5. User Stories

### 5.1. Onboarding & Authentication

- ID: US-001
- Title: New User Registration and Onboarding
- Description: As a new user, I want to sign up for the application using my Google account and be guided through an initial setup wizard so that I can quickly configure my family and start scheduling.
- Acceptance Criteria:
  - A "Sign in with Google" button is present on the landing page.
  - Upon successful Google authentication, a new user account is created in Supabase.
  - The user is immediately directed to a step-by-step onboarding wizard.
  - The wizard prompts the user to create a name for their family.
  - The wizard guides the user to connect at least one external calendar account (Google or Microsoft 365).
  - The wizard allows the user to create profiles for their children and invite other adult members via email.
  - The user can skip steps in the wizard and complete them later.

- ID: US-002
- Title: Existing User Login
- Description: As a returning user, I want to log in using my Google account so that I can access my family's calendar.
- Acceptance Criteria:
  - A "Sign in with Google" button is available for returning users.
  - Upon successful authentication, the user is redirected to their family's main calendar view.
  - If authentication fails, a clear error message is displayed.

- ID: US-003
- Title: Secure Access
- Description: As a logged-in user, I want to be sure that only members of my family can view and manage our calendar data.
- Acceptance Criteria:
  - User sessions are managed securely.
  - A user can only access the data associated with their family ID.
  - Unauthorized attempts to access another family's data are blocked and logged.

### 5.2. Family Management

- ID: US-004
- Title: Invite Adult Family Member
- Description: As an Admin, I want to invite another adult to join my family group so we can share and manage our schedules together.
- Acceptance Criteria:
  - An option to "Invite Member" is available in the family settings.
  - The Admin can enter the email address of the person they want to invite.
  - The invited person receives an email with a unique link to join the family.
  - Upon clicking the link and signing in, the new member is added to the family group.
  - Invited members have "Member" roles with full permissions to manage events.

- ID: US-005
- Title: Create Child Profile
- Description: As a parent, I want to create a profile for my child, who does not have an account, so that I can assign events to them.
- Acceptance Criteria:
  - An option to "Add Child" is available in the family settings.
  - The parent can enter the child's name to create a profile.
  - The child's profile appears in the list of family members for event assignment and filtering.

### 5.3. Event Creation & Management

- ID: US-006
- Title: Create a One-Time Blocker Event
- Description: As a user, I want to create a "Blocker" event for a fixed appointment, so that no other Blocker events can be scheduled at the same time.
- Acceptance Criteria:
  - I can create an event by clicking a "+" button or by clicking and dragging on the calendar.
  - The event creation form includes a title, start time, end time, and participants.
  - There is a toggle to mark the event as "Blocker".
  - If the proposed time for the "Blocker" event conflicts with an existing "Blocker" event, the system prevents me from saving it and shows a clear error message.
  - The event is successfully saved and displayed on the calendar if there are no conflicts.

- ID: US-007
- Title: Create a One-Time Elastic Event
- Description: As a user, I want to create an "Elastic" event for a flexible task, allowing it to be scheduled even if other events exist at the same time.
- Acceptance Criteria:
  - I can create an event with a title, start/end time, and participants.
  - There is a toggle to mark the event as "Elastic" (or this is the default).
  - The system allows me to save the "Elastic" event even if it overlaps with other "Elastic" or "Blocker" events.
  - The event is successfully saved and displayed on the calendar, visually indicating an overlap if one exists.

- ID: US-008
- Title: Create a Recurring Event
- Description: As a user, I want to create a recurring event (e.g., weekly piano lessons) so that I don't have to enter it manually each time.
- Acceptance Criteria:
  - In the event creation form, I can select a recurrence option: daily, weekly, or monthly.
  - I am required to set an end date for the recurrence.
  - Upon saving, the event appears on the calendar at all specified recurring intervals until the end date.

- ID: US-009
- Title: Edit a Single Instance of a Recurring Event
- Description: As a user, I want to change the time of a single instance of a recurring event without affecting the other occurrences.
- Acceptance Criteria:
  - When I edit a recurring event, I am prompted to choose between "Edit only this event" or "Edit all future events."
  - If I choose "Edit only this event," the changes are applied only to that specific instance.
  - The rest of the events in the series remain unchanged.

- ID: US-010
- Title: Edit All Future Events in a Series
- Description: As a user, I want to change the time of all future instances of a recurring event from a certain point forward.
- Acceptance Criteria:
  - When I edit a recurring event, I am prompted to choose between "Edit only this event" or "Edit all future events."
  - If I choose "Edit all future events," the selected event and all subsequent events in the series are updated with the new details.
  - Past events in the series are not affected.

- ID: US-011
- Title: Delete an Event
- Description: As a user, I want to delete an event from the calendar.
- Acceptance Criteria:
  - I can select an event to view its details.
  - A "Delete" button is available.
  - If the event is recurring, I am asked whether to delete "only this event" or "all future events."
  - The selected event(s) are removed from the calendar.

### 5.4. Calendar Viewing & Interaction

- ID: US-012
- Title: View Calendar by Day, Week, Month, and Agenda
- Description: As a user, I want to switch between different calendar views (Daily, Weekly, Monthly, Agenda) so I can see my family's schedule at different levels of detail.
- Acceptance Criteria:
  - The UI provides clear controls to switch between Day, Week, Month, and Agenda views.
  - The Day view shows all events for a single day in a chronological timeline.
  - The Week view shows all events for the current week.
  - The Month view provides a high-level overview of events for the entire month.
  - The Agenda view lists upcoming events for the family in a chronological list.
  - All views are responsive and display correctly on both mobile and desktop screens.

- ID: US-013
- Title: Filter Calendar by Family Member
- Description: As a user, I want to filter the calendar to show only the schedules for specific family members so I can focus on relevant events.
- Acceptance Criteria:
  - A list of all family members (adults and children) is displayed next to the calendar.
  - I can select/deselect family members (e.g., using checkboxes) to show or hide their events.
  - The calendar view updates instantly to reflect the filter selection.
  - My filter preferences are saved for my next session.

### 5.5. External Calendar Synchronization

- ID: US-014
- Title: Connect an External Calendar
- Description: As a user, I want to connect my Google or Microsoft 365 calendar so that my existing events are visible within the Home Planner.
- Acceptance Criteria:
  - In my settings, there is an option to "Connect Calendar."
  - I can choose to connect a Google or Microsoft 365 account.
  - I am taken through the standard OAuth flow to grant read-only permission to my calendar.
  - Once connected, events from my external calendar appear on the Home Planner calendar.
  - I can connect multiple external accounts.

- ID: US-015
- Title: View Synced External Events
- Description: As a user, I want to see events from my synced external calendars displayed alongside my native Home Planner events.
- Acceptance Criteria:
  - Externally synced events are displayed on all calendar views.
  - By default, my external events appear as "Busy" blocks to other family members.
  - I have an option in settings to make specific external events fully visible to my family.
  - Synced events are clearly distinguished visually from native Home Planner events.
  - I cannot edit or delete synced events from within the Home Planner application.

- ID: US-016
- Title: Manually Refresh External Calendars
- Description: As a user, I want to manually trigger a sync with my external calendars to ensure I am seeing the most up-to-date information immediately.
- Acceptance Criteria:
  - A "Refresh" button is available on the calendar interface.
  - Clicking the button initiates a sync for all connected external calendars for my user account.
  - The calendar view updates with any new or changed events from the external source.

## 6. Success Metrics

### 6.1. Adoption and Engagement

- Adoption Rate: The number of families who successfully complete the onboarding wizard and connect at least one external calendar.
- User Engagement: The number of weekly active families (defined as families who create at least one native event per week).
- Feature Usage: The total number of events created, and the ratio of "Blocker" vs. "Elastic" events to measure the use of the core conflict management feature.

### 6.2. System Performance and Reliability

- System Reliability: The success rate of external calendar synchronizations (target > 99.5%).
- Application Performance: The average page load time for the main calendar view should be under 2 seconds.
- User Satisfaction: Qualitative feedback gathered through surveys or feedback forms regarding ease of use and effectiveness in solving scheduling problems.

## Appendix A: Architecture Reference

- For the backend architectural approach (hexagonal architecture, repositories, DI via Astro middleware), see: `.ai/hexagonal-architecture-proposal.md`.
- This file is committed to the repo and is readable by LLM tooling when referenced by its path. When asking the LLM about architecture specifics, include the relative path in your prompt to ensure it loads the correct document.
