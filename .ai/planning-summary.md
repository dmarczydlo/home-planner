<conversation_summary>
<decisions>
Family Management: A primary "Admin/Parent" account will manage the family, including creating and managing profiles for children who will not have their own accounts. All adult "Members" have permission to create and update events for children.
Event Conflict Logic: "Elastic" events can be overlapped. "Blocker" events cannot overlap with other "Blocker" events. The system must check for overlaps when creating events and syncing external calendars, and notify the user of conflicts.
Calendar Views: The application must support Daily, Weekly, Monthly, and Agenda views. All views must be fully responsive and optimized for both desktop and mobile use.
Onboarding: A step-by-step wizard will be implemented to guide new users through the initial setup process (account creation, calendar connection, inviting members).
External Calendars: Events synced from external calendars (like Google Calendar) are strictly read-only within the application to prevent unintended changes to the source.
Event/Task Definition: There is no functional difference between "tasks" and "events." They are a single entity and will not have a completion state (e.g., 'to-do', 'done').
MVP Event Properties: Events will have a title, start/end time, participants, and an "elastic/blocker" toggle.
Authentication: The system will use Supabase for the backend and will support "Sign in with Google" for user authentication.
Privacy: For synced external calendars, the system will default to showing only "Busy" blocks for other family members, with the option for the calendar owner to make specific events fully visible.
Event Creation Workflow: Event creation must be optimized for both desktop (supporting click-and-drag and a dedicated button) and mobile (using a prominent "+" button).
Participants: The "participants" field will initially serve as a visual label to indicate who is involved in an event, without triggering notifications.
</decisions>
<matched_recommendations>
User Roles: Implement a system with a primary "Admin" or "Parent" account for family management and a "Member" role for other adults.
Onboarding: Design a step-by-step wizard for the first-time user to ensure successful setup and adoption.
Event Properties: For the MVP, limit event properties to a title, start/end time, participants, and the "elastic/blocker" toggle to keep the creation process simple.
Notifications: For the MVP, implement optional reminders for upcoming events and critical notifications for scheduling conflicts.
Recurring Events: Support the most common recurrence patterns: daily, weekly, and monthly, with a required end date.
Conflict UI: The UI should prevent the saving of a conflicting "blocker" event and display a clear, in-line error message.
Calendar Sync: Implement a periodic background sync (e.g., every 15 minutes) and include a manual "Refresh" button for on-demand updates.
Filtering: Provide a simple filtering mechanism (e.g., checkboxes) to allow users to view schedules for specific family members.
Time Zones: Store all event times in UTC on the backend (Supabase) and render them in the user's local time zone in the browser.
Mobile Optimization: Prioritize the mobile experience for the most common tasks: viewing the day's agenda and adding a new event.
Future-Proofing: While focusing on the MVP, design the system with future premium features in mind to avoid costly re-architecture.
UI Conventions: Display multi-day events as a banner at the top of the calendar view and create a separate section for "all-day" events.
Editing Recurring Events: When editing a recurring event, provide users with two simple choices: "Edit only this event" or "Edit all future events."
</matched_recommendations>
<prd_planning_summary>
This document summarizes the product requirements for the Home Planner MVP, a web application designed to help families better coordinate and plan their schedules.
a. Main Functional Requirements:
Family & User Management: The system will be built around a "family" unit. An "Admin" user can invite other adult "Members" and create/manage profiles for children. Authentication will be handled by Supabase, with "Sign in with Google" as the primary method.
Core Calendar Functionality: The application will feature a comprehensive, responsive calendar supporting Daily, Weekly, Monthly, and Agenda views. Users will be able to filter the calendar to see events for specific family members.
Event Management: Users can create events with essential details: title, time, participants, and a type (Elastic or Blocker). The system will support basic recurring events (daily, weekly, monthly).
Conflict Resolution: "Blocker" events are rigid and cannot be scheduled over an existing "Blocker" event. The UI will prevent such conflicts and provide immediate feedback. "Elastic" events are flexible and can be overlapped.
External Calendar Integration: The MVP will support one-way, read-only synchronization with Google Calendar. To protect privacy, externally synced events will appear as "Busy" by default to other family members. Sync will occur periodically and on-demand.
b. Key User Stories and Usage Paths:
Onboarding: A new parent signs up using their Google account, is guided through a wizard to create their family, connect their own calendar, and create profiles for their spouse and children.
Scheduling a Firm Appointment: A parent needs to schedule a "Blocker" event for a child's doctor appointment, ensuring no other conflicting activities can be planned at that time.
Planning a Flexible Task: A user adds an "Elastic" event like "Go grocery shopping" for Saturday afternoon, knowing it can be moved if a more important family activity comes up.
Daily Check-in: A user opens the app on their mobile phone in the morning to quickly review the day's agenda for the entire family, filtering to see just their own and their children's schedules.
c. Important Success Criteria and Measurement:
Adoption Rate: The number of families who successfully complete the onboarding wizard and connect at least one external calendar.
User Engagement: The weekly number of active families (families who create at least one event per week).
Core Feature Usage: The total number of events created and the ratio of "Blocker" vs. "Elastic" events, indicating if the core conflict management feature is being used.
System Reliability: The success rate of external calendar syncs and an application load time of under 2 seconds.
</prd_planning_summary>
<unresolved_issues>
Detailed UI/UX for Conflict Notification: The logic for conflict resolution is defined, but the specific user interface and experience (e.g., the exact wording of notifications, visual cues) for alerting users to a conflict needs to be designed.
Onboarding Wizard Content: The requirement for a step-by-step onboarding wizard is clear, but the detailed content, microcopy, and flow for each step need to be created.
Time Zone Handling in UI: The technical approach (UTC backend, local frontend) is decided, but the application needs a clear UI strategy for how it communicates time zones to users, especially if family members are in different locations.
</unresolved_issues>
</conversation_summary>
