# REST API Plan - Home Planner

## 1. Resources

| Resource           | Database Table              | Description                                            |
| ------------------ | --------------------------- | ------------------------------------------------------ |
| Users              | `public.users`              | User profile information extending Supabase auth.users |
| Families           | `public.families`           | Central family units                                   |
| Family Members     | `public.family_members`     | Junction table linking users to families with roles    |
| Children           | `public.children`           | Child profiles without user accounts                   |
| Events             | `public.events`             | Calendar events and tasks                              |
| Event Participants | `public.event_participants` | Links events to users/children                         |
| Event Exceptions   | `public.event_exceptions`   | Modifications to recurring event instances             |
| External Calendars | `public.external_calendars` | Connected external calendar accounts                   |
| Invitations        | `public.invitations`        | Family membership invitations                          |
| Logs               | `public.logs`               | Audit trail for user and system actions                |

## 2. Endpoints

### 2.1. Authentication

Authentication is handled by Supabase Auth. All endpoints require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

**OAuth Initiation (Google)**

- Handled by Supabase Auth client library
- Redirect URL configured in Supabase dashboard

### 2.2. Users

#### Get Current User Profile

**GET** `/api/users/me`

Retrieves the authenticated user's profile along with their family memberships.

**Query Parameters:** None

**Response (200 OK):**

```json
{
  "id": "uuid",
  "full_name": "string",
  "avatar_url": "string",
  "updated_at": "ISO8601 timestamp",
  "families": [
    {
      "family_id": "uuid",
      "family_name": "string",
      "role": "admin|member",
      "joined_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token

#### Update Current User Profile

**PATCH** `/api/users/me`

Updates the authenticated user's profile information.

**Request Payload:**

```json
{
  "full_name": "string (optional)",
  "avatar_url": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "full_name": "string",
  "avatar_url": "string",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid payload

#### Get Family Members

**GET** `/api/users`

Retrieves all users who are members of the same families as the authenticated user.

**Query Parameters:**

- `family_id` (optional): Filter users by specific family

**Response (200 OK):**

```json
{
  "users": [
    {
      "id": "uuid",
      "full_name": "string",
      "avatar_url": "string"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of specified family

### 2.3. Families

#### Create Family

**POST** `/api/families`

Creates a new family with the authenticated user as the admin.

**Request Payload:**

```json
{
  "name": "string (required)"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp",
  "role": "admin"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Missing required field 'name'

#### Get Family Details

**GET** `/api/families/{familyId}`

Retrieves details for a specific family, including all members.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp",
  "members": [
    {
      "user_id": "uuid",
      "full_name": "string",
      "avatar_url": "string",
      "role": "admin|member",
      "joined_at": "ISO8601 timestamp"
    }
  ],
  "children": [
    {
      "id": "uuid",
      "name": "string",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist

#### Update Family

**PATCH** `/api/families/{familyId}`

Updates family details. Only admins can perform this action.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Request Payload:**

```json
{
  "name": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not an admin of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Invalid payload

#### Delete Family

**DELETE** `/api/families/{familyId}`

Deletes a family and all associated data. Only admins can perform this action.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not an admin of this family
- `404 Not Found`: Family does not exist

### 2.4. Family Members

#### Remove Family Member

**DELETE** `/api/families/{familyId}/members/{userId}`

Removes a member from a family. Admins can remove any member; regular members can only remove themselves.

**Path Parameters:**

- `familyId` (required): UUID of the family
- `userId` (required): UUID of the user to remove

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User lacks permission to remove this member
- `404 Not Found`: Family or user does not exist

#### Update Member Role

**PATCH** `/api/families/{familyId}/members/{userId}`

Updates a member's role within the family. Only admins can perform this action.

**Path Parameters:**

- `familyId` (required): UUID of the family
- `userId` (required): UUID of the user

**Request Payload:**

```json
{
  "role": "admin|member (required)"
}
```

**Response (200 OK):**

```json
{
  "family_id": "uuid",
  "user_id": "uuid",
  "role": "admin|member",
  "joined_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User is not an admin of this family
- `404 Not Found`: Family or user does not exist
- `400 Bad Request`: Invalid role value

### 2.5. Children

#### List Children

**GET** `/api/families/{familyId}/children`

Retrieves all children profiles for a family.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Response (200 OK):**

```json
{
  "children": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "name": "string",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist

#### Create Child Profile

**POST** `/api/families/{familyId}/children`

Creates a new child profile for a family.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Request Payload:**

```json
{
  "name": "string (required)"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Missing required field 'name'

#### Update Child Profile

**PATCH** `/api/families/{familyId}/children/{childId}`

Updates a child's profile information.

**Path Parameters:**

- `familyId` (required): UUID of the family
- `childId` (required): UUID of the child

**Request Payload:**

```json
{
  "name": "string (optional)"
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "name": "string",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family or child does not exist
- `400 Bad Request`: Invalid payload

#### Delete Child Profile

**DELETE** `/api/families/{familyId}/children/{childId}`

Deletes a child's profile.

**Path Parameters:**

- `familyId` (required): UUID of the family
- `childId` (required): UUID of the child

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family or child does not exist

### 2.6. Events

#### List Events

**GET** `/api/events`

Retrieves events for the user's family, with filtering and pagination support.

**Query Parameters:**

- `family_id` (required): UUID of the family
- `start_date` (required): ISO8601 date - start of range
- `end_date` (required): ISO8601 date - end of range
- `participant_ids` (optional): Comma-separated list of user/child UUIDs to filter by
- `event_type` (optional): Filter by 'elastic' or 'blocker'
- `include_synced` (optional, default: true): Include external calendar events
- `view` (optional): 'day', 'week', 'month', 'agenda' (affects formatting)
- `limit` (optional, default: 100): Maximum number of results
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**

```json
{
  "events": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "title": "string",
      "start_time": "ISO8601 timestamp",
      "end_time": "ISO8601 timestamp",
      "is_all_day": "boolean",
      "event_type": "elastic|blocker",
      "recurrence_pattern": "object|null",
      "is_synced": "boolean",
      "external_calendar_id": "uuid|null",
      "created_at": "ISO8601 timestamp",
      "updated_at": "ISO8601 timestamp",
      "participants": [
        {
          "id": "uuid",
          "name": "string",
          "type": "user|child",
          "avatar_url": "string|null"
        }
      ],
      "has_conflict": "boolean"
    }
  ],
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer",
    "has_more": "boolean"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of specified family
- `400 Bad Request`: Invalid query parameters

#### Get Single Event

**GET** `/api/events/{eventId}`

Retrieves details for a specific event.

**Path Parameters:**

- `eventId` (required): UUID of the event

**Query Parameters:**

- `date` (optional): For recurring events, get details for specific occurrence

**Response (200 OK):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": {
    "frequency": "daily|weekly|monthly",
    "interval": "integer",
    "end_date": "ISO8601 date"
  },
  "is_synced": "boolean",
  "external_calendar_id": "uuid|null",
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [
    {
      "id": "uuid",
      "name": "string",
      "type": "user|child",
      "avatar_url": "string|null"
    }
  ],
  "exceptions": [
    {
      "id": "uuid",
      "original_date": "ISO8601 timestamp",
      "new_start_time": "ISO8601 timestamp|null",
      "new_end_time": "ISO8601 timestamp|null",
      "is_cancelled": "boolean"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of the family
- `404 Not Found`: Event does not exist

#### Create Event

**POST** `/api/events`

Creates a new event with automatic conflict detection for blocker events.

**Request Payload:**

```json
{
  "family_id": "uuid (required)",
  "title": "string (required)",
  "start_time": "ISO8601 timestamp (required)",
  "end_time": "ISO8601 timestamp (required)",
  "is_all_day": "boolean (optional, default: false)",
  "event_type": "elastic|blocker (optional, default: elastic)",
  "recurrence_pattern": {
    "frequency": "daily|weekly|monthly (required if recurring)",
    "interval": "integer (optional, default: 1)",
    "end_date": "ISO8601 date (required if recurring)"
  },
  "participants": [
    {
      "id": "uuid (required)",
      "type": "user|child (required)"
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": "object|null",
  "is_synced": false,
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [...]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of specified family
- `400 Bad Request`: Invalid payload or validation errors
- `409 Conflict`: Blocker event conflicts with existing blocker event
  ```json
  {
    "error": "conflict",
    "message": "This blocker event conflicts with an existing blocker event",
    "conflicting_events": [
      {
        "id": "uuid",
        "title": "string",
        "start_time": "ISO8601 timestamp",
        "end_time": "ISO8601 timestamp"
      }
    ]
  }
  ```

**Validation Rules:**

- `title`: Required, non-empty string
- `start_time`: Required, must be valid ISO8601 timestamp
- `end_time`: Required, must be after start_time
- `event_type`: Must be 'elastic' or 'blocker'
- `recurrence_pattern.end_date`: Required if recurrence_pattern is provided, must be after start_time
- `participants`: Each participant must have valid id and type
- For blocker events: System checks for time overlap with other blocker events for same participants

#### Update Event

**PATCH** `/api/events/{eventId}`

Updates an existing event. For recurring events, scope can be specified.

**Path Parameters:**

- `eventId` (required): UUID of the event

**Query Parameters:**

- `scope` (optional, default: 'this'): 'this' | 'future' | 'all'
  - 'this': Update only the specified occurrence (for recurring events, requires `date` parameter)
  - 'future': Update this and all future occurrences from specified date
  - 'all': Update all occurrences
- `date` (optional): Required when scope='this' for recurring events - ISO8601 date of occurrence to modify

**Request Payload:**

```json
{
  "title": "string (optional)",
  "start_time": "ISO8601 timestamp (optional)",
  "end_time": "ISO8601 timestamp (optional)",
  "is_all_day": "boolean (optional)",
  "event_type": "elastic|blocker (optional)",
  "recurrence_pattern": "object (optional)",
  "participants": [
    {
      "id": "uuid",
      "type": "user|child"
    }
  ]
}
```

**Response (200 OK):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "title": "string",
  "start_time": "ISO8601 timestamp",
  "end_time": "ISO8601 timestamp",
  "is_all_day": "boolean",
  "event_type": "elastic|blocker",
  "recurrence_pattern": "object|null",
  "is_synced": false,
  "created_at": "ISO8601 timestamp",
  "updated_at": "ISO8601 timestamp",
  "participants": [...],
  "exception_created": "boolean (true if scope='this' created an exception)"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of the family or event is synced (read-only)
- `404 Not Found`: Event does not exist
- `400 Bad Request`: Invalid payload or missing required parameters
- `409 Conflict`: Updated blocker event would conflict with existing blocker

**Business Logic:**

- If event is synced (`is_synced: true`), update is forbidden
- For scope='this' on recurring events, an event_exception is created
- For scope='future', the recurrence_pattern end_date is adjusted, and a new event is created for future occurrences
- Conflict checking applies if event_type changes to 'blocker' or time changes

#### Delete Event

**DELETE** `/api/events/{eventId}`

Deletes an event or specific occurrences of a recurring event.

**Path Parameters:**

- `eventId` (required): UUID of the event

**Query Parameters:**

- `scope` (optional, default: 'this'): 'this' | 'future' | 'all'
- `date` (optional): Required when scope='this' for recurring events

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of the family or event is synced (read-only)
- `404 Not Found`: Event does not exist
- `400 Bad Request`: Invalid query parameters

**Business Logic:**

- If event is synced, deletion is forbidden
- For scope='this' on recurring events, an event_exception with `is_cancelled: true` is created
- For scope='future', the recurrence_pattern end_date is adjusted to end before the specified date
- For scope='all', the event record is deleted

#### Validate Event

**POST** `/api/events/validate`

Validates an event without saving it, useful for UI feedback before submission.

**Request Payload:**

```json
{
  "family_id": "uuid (required)",
  "title": "string (required)",
  "start_time": "ISO8601 timestamp (required)",
  "end_time": "ISO8601 timestamp (required)",
  "is_all_day": "boolean (optional)",
  "event_type": "elastic|blocker (required)",
  "participants": [
    {
      "id": "uuid",
      "type": "user|child"
    }
  ],
  "exclude_event_id": "uuid (optional, for updates)"
}
```

**Response (200 OK):**

```json
{
  "valid": "boolean",
  "errors": [
    {
      "field": "string",
      "message": "string"
    }
  ],
  "conflicts": [
    {
      "id": "uuid",
      "title": "string",
      "start_time": "ISO8601 timestamp",
      "end_time": "ISO8601 timestamp",
      "participants": [...]
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of specified family
- `400 Bad Request`: Invalid payload

### 2.7. External Calendars

#### List External Calendars

**GET** `/api/external-calendars`

Retrieves all external calendar connections for the authenticated user.

**Response (200 OK):**

```json
{
  "calendars": [
    {
      "id": "uuid",
      "provider": "google|microsoft",
      "account_email": "string",
      "last_synced_at": "ISO8601 timestamp|null",
      "created_at": "ISO8601 timestamp",
      "sync_status": "active|error",
      "error_message": "string|null"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token

#### Connect External Calendar

**POST** `/api/external-calendars`

Initiates OAuth flow to connect an external calendar.

**Request Payload:**

```json
{
  "provider": "google|microsoft (required)"
}
```

**Response (200 OK):**

```json
{
  "authorization_url": "string",
  "state": "string"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `400 Bad Request`: Invalid provider

**Business Logic:**

- Generates OAuth authorization URL with appropriate scopes
- State parameter includes user_id and CSRF token
- User is redirected to provider's authorization page
- After authorization, provider redirects to callback URL

#### Handle OAuth Callback

**GET** `/api/external-calendars/callback`

Handles the OAuth callback from external calendar providers.

**Query Parameters:**

- `code` (required): Authorization code from provider
- `state` (required): State parameter for CSRF protection
- `provider` (required): 'google' or 'microsoft'

**Response (302 Found):**

- Redirects to frontend with success/error status

**Business Logic:**

- Validates state parameter
- Exchanges authorization code for access and refresh tokens
- Encrypts and stores tokens
- Creates external_calendars record
- Triggers initial sync

#### Disconnect External Calendar

**DELETE** `/api/external-calendars/{calendarId}`

Disconnects an external calendar and removes associated synced events.

**Path Parameters:**

- `calendarId` (required): UUID of the external calendar

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Calendar does not belong to user
- `404 Not Found`: Calendar does not exist

**Business Logic:**

- Deletes all events with `external_calendar_id` matching this calendar
- Revokes OAuth tokens with provider (best effort)
- Deletes external_calendars record

#### Sync External Calendar

**POST** `/api/external-calendars/{calendarId}/sync`

Manually triggers synchronization for a specific external calendar.

**Path Parameters:**

- `calendarId` (required): UUID of the external calendar

**Response (200 OK):**

```json
{
  "synced_at": "ISO8601 timestamp",
  "events_added": "integer",
  "events_updated": "integer",
  "events_removed": "integer",
  "status": "success|partial|error",
  "error_message": "string|null"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: Calendar does not belong to user
- `404 Not Found`: Calendar does not exist
- `429 Too Many Requests`: Sync rate limit exceeded

**Business Logic:**

- Refreshes access token if expired
- Fetches events from external provider
- Creates/updates events with `is_synced: true`
- Removes events that no longer exist externally
- Updates `last_synced_at` timestamp

#### Sync All External Calendars

**POST** `/api/external-calendars/sync`

Manually triggers synchronization for all of the user's external calendars.

**Response (200 OK):**

```json
{
  "results": [
    {
      "calendar_id": "uuid",
      "synced_at": "ISO8601 timestamp",
      "events_added": "integer",
      "events_updated": "integer",
      "events_removed": "integer",
      "status": "success|partial|error",
      "error_message": "string|null"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `429 Too Many Requests`: Sync rate limit exceeded

### 2.8. Invitations

#### List Family Invitations

**GET** `/api/families/{familyId}/invitations`

Retrieves all invitations for a family (pending, accepted, expired).

**Path Parameters:**

- `familyId` (required): UUID of the family

**Query Parameters:**

- `status` (optional): Filter by 'pending' | 'accepted' | 'expired'

**Response (200 OK):**

```json
{
  "invitations": [
    {
      "id": "uuid",
      "family_id": "uuid",
      "invited_by": {
        "id": "uuid",
        "full_name": "string"
      },
      "invitee_email": "string",
      "status": "pending|accepted|expired",
      "expires_at": "ISO8601 timestamp",
      "created_at": "ISO8601 timestamp"
    }
  ]
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist

#### Create Invitation

**POST** `/api/families/{familyId}/invitations`

Creates a new invitation to join the family.

**Path Parameters:**

- `familyId` (required): UUID of the family

**Request Payload:**

```json
{
  "invitee_email": "string (required, valid email)"
}
```

**Response (201 Created):**

```json
{
  "id": "uuid",
  "family_id": "uuid",
  "invited_by": "uuid",
  "invitee_email": "string",
  "token": "string",
  "status": "pending",
  "expires_at": "ISO8601 timestamp",
  "created_at": "ISO8601 timestamp",
  "invitation_url": "string"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family does not exist
- `400 Bad Request`: Invalid email or user already a member
- `409 Conflict`: Pending invitation already exists for this email

**Validation Rules:**

- Email must be valid format
- User with this email must not already be a family member
- No existing pending invitation for this email to this family
- Token is generated as secure random string
- Expiration is set to 7 days from creation

**Business Logic:**

- Generates unique secure token
- Sends invitation email with link containing token
- Logs invitation creation

#### Cancel Invitation

**DELETE** `/api/families/{familyId}/invitations/{invitationId}`

Cancels a pending invitation.

**Path Parameters:**

- `familyId` (required): UUID of the family
- `invitationId` (required): UUID of the invitation

**Response (204 No Content)**

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not a member of this family
- `404 Not Found`: Family or invitation does not exist
- `400 Bad Request`: Invitation is not pending

#### Get Invitation Details

**GET** `/api/invitations/{token}`

Retrieves invitation details by token (public endpoint, no auth required).

**Path Parameters:**

- `token` (required): Invitation token from email link

**Response (200 OK):**

```json
{
  "id": "uuid",
  "family": {
    "id": "uuid",
    "name": "string"
  },
  "invited_by": {
    "full_name": "string"
  },
  "invitee_email": "string",
  "status": "pending|accepted|expired",
  "expires_at": "ISO8601 timestamp",
  "created_at": "ISO8601 timestamp"
}
```

**Error Responses:**

- `404 Not Found`: Invalid token
- `410 Gone`: Invitation has expired

#### Accept Invitation

**POST** `/api/invitations/{token}/accept`

Accepts a family invitation. User must be authenticated.

**Path Parameters:**

- `token` (required): Invitation token

**Response (200 OK):**

```json
{
  "family": {
    "id": "uuid",
    "name": "string",
    "role": "member"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: User must be logged in to accept
- `404 Not Found`: Invalid token
- `410 Gone`: Invitation has expired
- `409 Conflict`: User is already a member of this family
- `400 Bad Request`: Authenticated user's email doesn't match invitation email

**Business Logic:**

- Validates token and expiration
- Checks authenticated user's email matches invitee_email
- Creates family_members record with role 'member'
- Updates invitation status to 'accepted'
- Logs acceptance

### 2.9. Logs (Audit Trail)

#### List Audit Logs

**GET** `/api/logs`

Retrieves audit logs for the user's families. Admins can view all family logs; members can view logs related to their own actions.

**Query Parameters:**

- `family_id` (optional): Filter by specific family
- `actor_id` (optional): Filter by specific user
- `action` (optional): Filter by action type (e.g., 'event.create')
- `start_date` (optional): ISO8601 date - start of time range
- `end_date` (optional): ISO8601 date - end of time range
- `limit` (optional, default: 50): Maximum number of results
- `offset` (optional, default: 0): Pagination offset

**Response (200 OK):**

```json
{
  "logs": [
    {
      "id": "integer",
      "family_id": "uuid|null",
      "actor_id": "uuid|null",
      "actor_type": "user|system",
      "action": "string",
      "details": "object|null",
      "created_at": "ISO8601 timestamp"
    }
  ],
  "pagination": {
    "total": "integer",
    "limit": "integer",
    "offset": "integer",
    "has_more": "boolean"
  }
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User not authorized to view these logs

**Business Logic:**

- Non-admin members can only view their own actions
- Admins can view all family logs
- System actions are visible to all family members

## 3. Authentication and Authorization

### 3.1. Authentication Mechanism

The application uses **Supabase Auth** for authentication with the following configuration:

- **Primary Method**: "Sign in with Google" (OAuth 2.0)
- **Token Type**: JWT (JSON Web Tokens)
- **Token Storage**: Client-side (localStorage or sessionStorage)
- **Token Transmission**: Authorization header: `Bearer <jwt_token>`

### 3.2. Authentication Flow

1. User clicks "Sign in with Google" button
2. Client initiates OAuth flow via Supabase Auth client library
3. User authenticates with Google and grants permissions
4. Google redirects back to application with authorization code
5. Supabase exchanges code for JWT access token and refresh token
6. Client stores tokens and includes JWT in all API requests
7. JWT expires after configurable period (default: 1 hour)
8. Client automatically refreshes token using refresh token

### 3.3. Authorization Model

Authorization is enforced at two levels:

#### Application-Level Authorization

All API endpoints validate:

1. **Valid JWT Token**: Request must include valid, non-expired JWT
2. **Family Membership**: User must be a member of the family they're accessing
3. **Role-Based Permissions**: Certain operations require 'admin' role

**Permission Matrix:**

| Operation                 | Admin | Member |
| ------------------------- | ----- | ------ |
| View family data          | ✓     | ✓      |
| Create/Edit/Delete events | ✓     | ✓      |
| Create child profiles     | ✓     | ✓      |
| Update family details     | ✓     | ✗      |
| Invite members            | ✓     | ✓      |
| Remove members (others)   | ✓     | ✗      |
| Remove self from family   | ✓     | ✓      |
| Change member roles       | ✓     | ✗      |
| Delete family             | ✓     | ✗      |

#### Database-Level Authorization (RLS)

Supabase Row-Level Security (RLS) policies enforce data isolation:

**Helper Function:**

```sql
CREATE FUNCTION is_family_member(target_family_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = target_family_id
    AND user_id = auth.uid()
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

**RLS Policies:**

- **families**: Users can only access families they belong to
- **family_members**: Users can view members of their families
- **children**: Users can access children of their families
- **events**: Users can access events of their families
- **event_participants**: Accessible via event access
- **event_exceptions**: Accessible via event access
- **external_calendars**: Users can only access their own calendar connections
- **invitations**: Users can view invitations for their families
- **logs**: Users can view logs for their families (with role restrictions)
- **users**: Users can view profiles of members in their families; can only update own profile

### 3.4. Security Measures

#### Rate Limiting

- **External Calendar Sync**: 1 sync per calendar per 5 minutes
- **API Requests**: 100 requests per minute per user
- **Invitation Creation**: 10 invitations per family per hour

#### Data Encryption

- **OAuth Tokens**: Encrypted at rest using AES-256
- **Invitation Tokens**: Cryptographically secure random strings (256-bit)
- **Database**: TLS encryption for data in transit

#### CORS Policy

- **Allowed Origins**: Configure specific frontend domain(s)
- **Allowed Methods**: GET, POST, PATCH, DELETE
- **Allowed Headers**: Authorization, Content-Type
- **Credentials**: Allowed for same-origin requests

#### Input Sanitization

- All input is validated against expected types and formats
- SQL injection prevented by parameterized queries
- XSS prevented by output encoding

## 4. Validation and Business Logic

### 4.1. Validation Rules by Resource

#### Families

- **name**: Required, non-empty string, max 100 characters

#### Users

- **full_name**: Optional, max 100 characters
- **avatar_url**: Optional, valid URL format

#### Children

- **name**: Required, non-empty string, max 100 characters
- **family_id**: Must reference existing family where user is a member

#### Events

- **title**: Required, non-empty string, max 200 characters
- **start_time**: Required, valid ISO8601 timestamp
- **end_time**: Required, valid ISO8601 timestamp, must be after start_time
- **is_all_day**: Boolean, default false
- **event_type**: Required, must be 'elastic' or 'blocker', default 'elastic'
- **recurrence_pattern**: Optional object
  - **frequency**: Required if present, must be 'daily', 'weekly', or 'monthly'
  - **interval**: Optional positive integer, default 1
  - **end_date**: Required if recurrence_pattern present, must be after start_time
- **participants**: Array, each item must have:
  - **id**: Required UUID, must reference existing user or child
  - **type**: Required, must be 'user' or 'child'
- **family_id**: Must reference existing family where user is a member

**Business Rules:**

- Blocker events cannot overlap with other blocker events for the same participants
- Elastic events can overlap with any other events
- Synced events cannot be modified or deleted
- All times stored in UTC, converted on client

#### Event Exceptions

- **event_id**: Must reference existing recurring event
- **original_date**: Required, valid ISO8601 timestamp
- **new_start_time**: Optional if is_cancelled is true, required otherwise
- **new_end_time**: Optional if is_cancelled is true, required otherwise, must be after new_start_time
- **is_cancelled**: Boolean, default false

#### External Calendars

- **provider**: Required, must be 'google' or 'microsoft'
- **account_email**: Required, valid email format
- **access_token**: Required, encrypted before storage
- **refresh_token**: Required, encrypted before storage

**Business Rules:**

- User can connect multiple calendars
- Same account_email can be connected only once per user per provider
- Sync events are read-only in Home Planner
- Default visibility for synced events is "Busy" to other family members

#### Invitations

- **invitee_email**: Required, valid email format
- **family_id**: Must reference existing family where inviter is a member
- **expires_at**: Automatically set to 7 days from creation

**Business Rules:**

- Cannot invite user who is already a family member
- Cannot have multiple pending invitations for same email to same family
- Token must be cryptographically secure (256-bit random)
- Expired invitations cannot be accepted
- Only pending invitations can be cancelled

### 4.2. Conflict Detection Logic

For blocker events, the system checks for time overlaps using the following logic:

```
For each participant P in new_event.participants:
  Query existing blocker events where:
    - event_type = 'blocker'
    - event contains participant P
    - Time ranges overlap:
      (new_start_time < existing_end_time AND new_end_time > existing_start_time)
    - Exclude new_event.id if updating
    - Account for recurring events and exceptions

  If any conflicts found:
    Return 409 Conflict with conflicting event details
```

**Recurring Event Overlap Check:**

- Generate all occurrences of recurring events within relevant time range
- Apply event exceptions (cancelled or rescheduled occurrences)
- Check each occurrence for overlaps

### 4.3. Recurring Event Business Logic

#### Creating Recurring Events

- Store base event with recurrence_pattern
- Generate occurrences on-the-fly when querying
- Apply end_date limit to generation

#### Editing Recurring Events

**Scope: 'this' (single occurrence)**

- Create event_exception record for the specific date
- Store modified start_time, end_time, and other properties in exception
- Base event remains unchanged

**Scope: 'future' (this and future occurrences)**

- Adjust base event's recurrence_pattern end_date to day before modification date
- Create new event with modified properties starting from modification date
- Maintain original event for past occurrences

**Scope: 'all' (all occurrences)**

- Update base event properties
- Delete any existing exceptions (they become invalid)

#### Deleting Recurring Events

**Scope: 'this'**

- Create event_exception with is_cancelled: true

**Scope: 'future'**

- Adjust recurrence_pattern end_date to day before deletion date

**Scope: 'all'**

- Delete base event and all exceptions (cascading)

### 4.4. External Calendar Sync Logic

#### Sync Process

1. **Refresh OAuth Token**: Check if access_token is expired; if so, use refresh_token to get new access_token
2. **Fetch Events**: Call provider API to get events within sync window (e.g., 90 days past, 365 days future)
3. **Reconcile Events**:
   - For each external event, check if corresponding synced event exists
   - Create new events with is_synced: true if not exists
   - Update existing synced events if modified
   - Delete synced events that no longer exist externally
4. **Update Timestamp**: Set last_synced_at to current time
5. **Log Result**: Record sync status and counts

#### Sync Schedule

- **Automatic**: Every 15 minutes via background job
- **Manual**: User-triggered via sync endpoint (rate-limited)

#### Error Handling

- **Token Expired**: Attempt to refresh; if refresh fails, mark calendar as error state
- **Rate Limit**: Retry with exponential backoff
- **Provider Error**: Log error, continue with other calendars

### 4.5. Audit Logging

All significant actions are logged to the `logs` table:

**Logged Actions:**

- `family.create`, `family.update`, `family.delete`
- `member.invite`, `member.join`, `member.remove`, `member.role_change`
- `child.create`, `child.update`, `child.delete`
- `event.create`, `event.update`, `event.delete`
- `event.exception.create`
- `external_calendar.connect`, `external_calendar.disconnect`, `external_calendar.sync`
- `invitation.create`, `invitation.accept`, `invitation.cancel`

**Log Entry Structure:**

```json
{
  "family_id": "uuid",
  "actor_id": "uuid",
  "actor_type": "user",
  "action": "event.create",
  "details": {
    "event_id": "uuid",
    "title": "Piano Lesson",
    "event_type": "blocker"
  }
}
```

### 4.6. Error Response Format

All error responses follow a consistent format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

**Common Error Codes:**

- `unauthorized`: Missing or invalid JWT token
- `forbidden`: User lacks required permissions
- `not_found`: Resource does not exist
- `bad_request`: Invalid input or validation error
- `conflict`: Operation conflicts with existing data
- `rate_limit_exceeded`: Too many requests
- `internal_error`: Unexpected server error

### 4.7. Pagination

List endpoints support pagination using offset/limit:

**Request:**

```
GET /api/events?limit=50&offset=100
```

**Response:**

```json
{
  "events": [...],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 100,
    "has_more": true
  }
}
```

**Limits:**

- Default limit: 50 for most endpoints, 100 for events
- Maximum limit: 100
- Maximum offset: No hard limit but performance degrades beyond 10,000

### 4.8. Time Zone Handling

- **Storage**: All timestamps stored in UTC in the database
- **API**: All timestamps in request/response payloads are ISO8601 format with timezone
- **Client**: Client is responsible for converting to/from user's local timezone
- **Recurring Events**: Recurrence calculations done in UTC; client handles DST transitions

## 5. Implementation Notes

### 5.1. Architecture Pattern

This API implementation follows **Hexagonal Architecture (Ports & Adapters)** as defined in the implementation document:

**Layer Structure:**

- **Domain Layer**: Business entities, DTOs, and repository interfaces (ports)
- **Infrastructure Layer**: Repository implementations (adapters) - SQL and in-memory
- **Application Layer**: Astro API routes that act as thin controllers
- **Dependency Injection**: Repositories created per-request in middleware and attached to `context.locals`

**Key Principle**: Business logic is isolated from infrastructure concerns, enabling testability and flexibility.

### 5.2. Error Handling with Result Pattern

All services use the **Result Object Pattern** for type-safe error handling:

**Result Type:**

```typescript
type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };
```

**Domain Errors:**

- `NotFoundError`: Resource not found (404)
- `ValidationError`: Invalid input data (400)
- `UnauthorizedError`: Authentication required (401)
- `ForbiddenError`: Insufficient permissions (403)
- `ConflictError`: Resource conflict (409)
- `DomainError`: Base error class with custom status codes

**Service Layer Pattern:**

Services return `Result<T, DomainError>` instead of throwing exceptions:

```typescript
class FamilyService {
  async getFamilyById(id: string, userId: string): Promise<Result<Family, DomainError>> {
    // Validation
    if (!id) {
      return err(new ValidationError("Family ID is required"));
    }

    // Business logic
    const family = await this.familyRepo.findById(id);
    if (!family) {
      return err(new NotFoundError("Family", id));
    }

    // Authorization check
    const isMember = await this.familyRepo.isUserMember(family.id, userId);
    if (!isMember) {
      return err(new ForbiddenError("You do not have access to this family"));
    }

    return ok(family);
  }
}
```

**API Route Pattern:**

API routes act as thin controllers that map `Result` to HTTP responses:

```typescript
export async function GET({ params, locals }: APIContext) {
  // Auth check
  const userId = requireAuth(locals);
  if (userId instanceof Response) return userId;

  // Call service (returns Result)
  const familyService = new FamilyService(locals.repositories.family);
  const result = await familyService.getFamilyById(params.id!, userId);

  // Map Result to HTTP Response
  return mapResultToResponse(result);
}
```

The `mapResultToResponse` utility automatically converts:

- `{ success: true, data: T }` → HTTP 200 with JSON body
- `{ success: false, error: DomainError }` → HTTP error code from `error.statusCode` with formatted error JSON

### 5.3. Tech Stack Integration

**Astro 5:**

- API routes defined in `src/pages/api/`
- Routes act as thin controllers (HTTP layer only)
- Endpoints return JSON responses via `mapResultToResponse`
- Middleware handles authentication, DI, and logging

**TypeScript:**

- Strong typing for all request/response payloads
- Shared types defined in `src/types/*.ts` (separate file per type)
- `src/types/index.ts` re-exports all types
- Generated types from Supabase schema via `database.types.ts`
- Zod schemas for runtime validation and type generation
- Result types for all service methods

**Supabase:**

- Authentication via Supabase Auth (JWT tokens)
- PostgreSQL database with Row-Level Security (RLS)
- Real-time subscriptions for live updates (future enhancement)
- Generated TypeScript types from database schema

**React 19:**

- Client-side rendering for dynamic components
- API calls via fetch with authentication headers
- State management with React hooks

### 5.4. Repository Pattern

All database operations use the repository pattern with interfaces (ports) and implementations (adapters):

**Repository Interfaces** (`src/repositories/interfaces/`):

- `UserRepository`: User profile operations
- `FamilyRepository`: Family and member operations
- `ChildRepository`: Child profile operations
- `EventRepository`: Event CRUD and conflict checking
- `EventExceptionRepository`: Recurring event exceptions
- `ExternalCalendarRepository`: External calendar connections
- `InvitationRepository`: Invitation management
- `LogRepository`: Audit logging

**Repository Implementations**:

- **SQL Implementation** (`src/repositories/implementations/sql/`): Production adapter using Supabase client
- **In-Memory Implementation** (`src/repositories/implementations/in-memory/`): Testing adapter with in-memory data

**Factory Pattern:**

```typescript
// src/repositories/factory.ts
export function createRepositories(client: SupabaseClient) {
  return {
    user: new SQLUserRepository(client),
    family: new SQLFamilyRepository(client),
    child: new SQLChildRepository(client),
    event: new SQLEventRepository(client),
    // ...
  };
}

export function createInMemoryRepositories() {
  return {
    user: new InMemoryUserRepository(),
    family: new InMemoryFamilyRepository(),
    // ...
  };
}
```

Repositories are instantiated per-request in middleware and injected via `context.locals.repositories`.

### 5.5. Service Layer

**Service Responsibilities:**

Services contain all business logic and return `Result<T, DomainError>`:

- **Input Validation**: Validate request data and return `ValidationError` if invalid
- **Business Rules**: Enforce domain rules (e.g., blocker event conflict detection)
- **Authorization Logic**: Check user permissions (e.g., family membership, admin role)
- **Repository Coordination**: Orchestrate multiple repository calls
- **Error Handling**: Convert infrastructure errors to domain errors

**Service Examples:**

- `FamilyService`: Family CRUD, member management, role assignment
- `EventService`: Event CRUD, conflict detection, recurring event handling
- `InvitationService`: Invitation creation, acceptance, validation
- `ExternalCalendarService`: OAuth flow, sync orchestration
- `AuthorizationService`: Permission checks, family membership validation

All services are stateless and constructed with repository dependencies injected.

### 5.6. Middleware

**Middleware Pipeline Order:**

1. **Authentication Middleware** (first)
2. **Repository Injection Middleware**
3. **Logging Middleware**
4. **Error Handling Middleware** (last)

**Authentication Middleware:**

- Validates JWT token from Authorization header
- Calls `supabase.auth.getUser()` to verify token
- Sets `locals.user` with authenticated user info
- Continues for unauthenticated routes (e.g., public invitation lookup)

**Repository Injection Middleware:**

- Creates Supabase client for the request
- Instantiates all repositories using factory pattern
- Attaches to `locals.repositories` for use in routes and services

**Logging Middleware:**

- Records all API requests with method, path, user, timestamp
- For state-changing operations (POST, PATCH, DELETE), creates audit log entries
- Logs are written to `public.logs` table

**Error Handling Middleware:**

- Catches any unhandled exceptions from routes or services
- Logs unexpected errors for monitoring
- Returns generic 500 error to client (without exposing internal details)
- **Note**: Most errors are handled via Result pattern and don't reach this middleware

### 5.7. Background Jobs

**Calendar Sync Job:**

- Runs every 15 minutes
- Processes all external calendars due for sync
- Updates last_synced_at timestamp

**Invitation Cleanup Job:**

- Runs daily
- Updates expired invitations (expires_at < now and status = 'pending')
- Sets status to 'expired'

**Log Retention Job:**

- Runs weekly
- Deletes logs older than configured retention period (e.g., 90 days)

## 6. API Versioning

Current version: **v1**

- All endpoints prefixed with `/api/`
- Breaking changes will require new version (`/api/v2/`)
- Non-breaking changes added to current version
- Version deprecation policy: 6 months notice before removing old version

## 7. Performance Considerations

### 7.1. Caching Strategy

- **User Sessions**: Cached in-memory with Supabase Auth
- **Family Membership**: Cached per request after first check
- **Event Queries**: No caching due to real-time nature; rely on database indexes

### 7.2. Database Indexes

As defined in db-plan.md:

- `events(family_id, start_time, end_time)`: Composite index for calendar queries
- `events(external_calendar_id)`: For sync operations
- `family_members(user_id)`: For authorization checks
- `event_participants(user_id, child_id)`: For filtering
- `invitations(token)`: For invitation lookup
- `logs(created_at, family_id, actor_id)`: For audit queries

### 7.3. Query Optimization

- Use date range filters to limit event queries
- Limit recurring event expansion to requested time window
- Batch operations where possible (e.g., bulk participant creation)
- Use database views for complex joins (e.g., events with participants)

### 7.4. Rate Limiting Implementation

- Token bucket algorithm
- Per-user and per-endpoint limits
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- 429 response when exceeded with Retry-After header

## 8. File Structure

Following Hexagonal Architecture principles, the codebase is organized as:

```
src/
├── domain/
│   ├── entities/              # Domain entities (Event, Family, User, etc.)
│   ├── dtos/                  # Data Transfer Objects
│   ├── result.ts              # Result type and helper functions
│   └── errors.ts              # Domain error classes
├── repositories/
│   ├── interfaces/            # Repository contracts (ports)
│   │   ├── UserRepository.ts
│   │   ├── FamilyRepository.ts
│   │   ├── EventRepository.ts
│   │   └── index.ts
│   ├── implementations/
│   │   ├── sql/              # SQL adapters (production)
│   │   │   ├── SQLUserRepository.ts
│   │   │   ├── SQLFamilyRepository.ts
│   │   │   └── SQLEventRepository.ts
│   │   └── in-memory/        # In-memory adapters (testing)
│   │       ├── InMemoryUserRepository.ts
│   │       ├── InMemoryFamilyRepository.ts
│   │       └── InMemoryEventRepository.ts
│   └── factory.ts            # Repository factory functions
├── services/                  # Business logic (use Result pattern)
│   ├── FamilyService.ts
│   ├── EventService.ts
│   ├── InvitationService.ts
│   └── ExternalCalendarService.ts
├── lib/
│   ├── http/
│   │   ├── responseMapper.ts # Maps Result to HTTP Response
│   │   └── apiHelpers.ts     # Common API route utilities
│   └── utils.ts              # General utilities
├── middleware/
│   └── index.ts              # Astro middleware (auth, DI, logging)
├── pages/
│   ├── api/                  # Astro API routes (controllers)
│   │   ├── users/
│   │   │   └── me.ts
│   │   ├── families/
│   │   │   ├── index.ts
│   │   │   └── [id].ts
│   │   ├── events/
│   │   │   ├── index.ts
│   │   │   ├── [id].ts
│   │   │   └── validate.ts
│   │   └── ...
│   └── index.astro           # Frontend pages
├── types/                     # TypeScript types
│   ├── family.ts
│   ├── event.ts
│   ├── user.ts
│   └── index.ts              # Re-exports all types
├── db/
│   ├── supabase.client.ts    # Supabase client factory
│   └── database.types.ts     # Generated Supabase types
└── components/               # React/Astro components
```

**Key Principles:**

- **Domain Layer** (`domain/`, `types/`): Pure TypeScript, no dependencies on infrastructure
- **Repository Interfaces** (`repositories/interfaces/`): Define contracts, independent of implementation
- **Repository Implementations** (`repositories/implementations/`): Depend on infrastructure (Supabase)
- **Services** (`services/`): Depend only on repository interfaces, not implementations
- **API Routes** (`pages/api/`): Thin controllers that delegate to services and map Results to HTTP
- **Middleware** (`middleware/`): Cross-cutting concerns (auth, DI, logging)

## 9. Validation Summary

### ✅ Alignment with Implementation Document

The API plan is now fully aligned with the implementation document:

1. **Architecture**: Uses Hexagonal Architecture (Ports & Adapters) with clear layer separation
2. **Error Handling**: Services use Result pattern (`Result<T, DomainError>`) instead of throwing exceptions
3. **API Routes**: Act as thin controllers that map `Result` to HTTP responses via `mapResultToResponse`
4. **Repositories**: Interface-based with SQL and in-memory implementations
5. **Dependency Injection**: Repositories injected via middleware into `context.locals`
6. **Type Safety**: TypeScript throughout with Zod schemas for runtime validation
7. **Service Layer**: Contains all business logic, validation, and authorization
8. **Middleware**: Handles auth, repository injection, logging, and error handling

### 📋 Implementation Checklist

When implementing the API, ensure:

- [ ] All services return `Result<T, DomainError>`
- [ ] API routes use `mapResultToResponse` for consistent response formatting
- [ ] Domain errors extend `DomainError` with appropriate `statusCode`
- [ ] Repositories follow interface contracts defined in `repositories/interfaces/`
- [ ] Business logic resides in services, not API routes
- [ ] Validation returns `ValidationError` with field-level details
- [ ] Authorization checks return `ForbiddenError` or `UnauthorizedError`
- [ ] Resource conflicts return `ConflictError` (409)
- [ ] Middleware injects repositories via `context.locals.repositories`
- [ ] Tests use in-memory repository implementations

### 🎯 Key Benefits

This architecture provides:

- **Type Safety**: Errors are part of the type system, cannot be ignored
- **Testability**: Services can be tested with in-memory repositories
- **Maintainability**: Business logic is isolated from HTTP and database concerns
- **Flexibility**: Repository implementations can be swapped without changing services
- **Explicit Error Handling**: All error paths are explicit in function signatures
- **Consistency**: Standardized error responses across all endpoints
