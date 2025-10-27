# Home Planner Specification

## Problem Statement

Our family faces challenges with coordinating schedules and planning time for various tasks and activities. The primary scheduling conflicts arise from:

### Current Blockers

- **Children's Activities**

  - Regular kindergarten schedule
  - Extra lessons (both random and recurring/periodic)

- **Adult Work Schedules**
  - Both adults not work during the same hours
  - Some meetings are fixed and non-negotiable (hard blocks)
  - Other meetings have flexibility for scheduling activities during working hours (soft blocks)
  - Currently using manual/paper calendars that cannot be easily shared

### Primary Goal

Improve planning and coordination of family activities and tasks by providing a centralized, shared calendar system that accounts for both fixed commitments and flexible time slots.

## System Requirements

### Calendar Integration

- Must synchronize with popular calendar services (support multiple accounts per user):
  - Google Calendar
  - Microsoft 365 Calendar

### User Management

- Require user authentication/login to create and share calendars
- Support multiple family members (actors), each with their own name and profile
- Distinguish between adults and children as different user types

### Calendar Features

- Provide a proprietary calendar system where users can define tasks and activities
- Assign tasks/activities to specific family members (adults and/or children)

### Task/Activity Types

Tasks should support common scheduling options:

- **Periodic/Recurring**: Tasks that repeat on a schedule
- **One-time**: Single occurrence events
- **Vacation**: Time-off periods
- **Meeting**: Scheduled appointments

### Task Priority System

- **Elastic Tasks**: Can be overridden or rescheduled if conflicts arise
- **Blocker Tasks**: Fixed commitments that cannot be overridden (hard constraints)
