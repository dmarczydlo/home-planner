# Implementation Plan: Family Management

## Mobile-First Design

## 1. Overview

**Purpose**: Manage family members, children, and invitations

**Routes**:

- `/family/overview` - Family overview
- `/family/members` - Members list
- `/family/children` - Children list
- `/family/invitations` - Invitations list

**Key Features**:

- View family members
- Add/remove children
- Invite family members
- Manage invitations
- Role management (admin only)

## 2. Mobile-First Design Specifications

### 2.1. Family Overview Layout (Mobile)

```
┌─────────────────────────────────┐
│ [←] Family                      │ ← Header
├─────────────────────────────────┤
│                                 │
│  The Smith Family               │
│  Created: Jan 2024              │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Members (3)               │ │
│  │ [Member Card]             │ │
│  │ [Member Card]             │ │
│  │ [Member Card]             │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Children (2)              │ │
│  │ [Child Card]              │ │
│  │ [Child Card]              │ │
│  └───────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐ │
│  │ Invitations (1)           │ │
│  │ [Invitation Card]         │ │
│  └───────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│ [📅] [👥] [⚙️] [👤]              │ ← Bottom Nav
└─────────────────────────────────┘
```

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**

- Single column layout
- Card-based lists
- Bottom sheets for forms
- Swipe actions

**Tablet (768px - 1023px):**

- Two-column layout (optional)
- Larger cards
- Modals for forms

**Desktop (1024px+):**

- Multi-column layout
- Table view (optional)
- Side panels

## 3. Component Structure

### 3.1. Family Overview Component

**File**: `src/components/family/FamilyOverview.tsx`

**Structure:**

```typescript
<FamilyOverview>
  <FamilyHeader />
  <FamilyStats />
  <MembersSection />
  <ChildrenSection />
  <InvitationsSection />
</FamilyOverview>
```

### 3.2. Sub-Views

**MembersList** (`/family/members`)

- List of family members
- Role badges
- Admin actions
- Invite button

**ChildrenList** (`/family/children`)

- List of children
- Add child button
- Edit/delete actions

**InvitationsList** (`/family/invitations`)

- Pending invitations
- Status badges
- Cancel action
- Resend option

## 4. User Flow

### 4.1. View Family Overview

```
1. Navigate to Family
   └─> Family overview loads
       └─> Fetch family data
           └─> Display members, children, invitations
               └─> User can:
                   ├─> View members list
                   ├─> View children list
                   ├─> View invitations
                   └─> Invite member (admin only - button hidden for members)
```

### 4.2. Invite Member Flow (Admin Only)

```
1. Admin taps "Invite Member" button
   └─> Invite form opens (bottom sheet)
       └─> Enter email address
           └─> Tap "Send Invitation"
               └─> API: POST /api/families/{id}/invitations
                   ├─> Success: Show toast, update list
                   └─> Error: Show error message

Note: "Invite Member" button is only visible to admins.
Members do not see this option.
```

### 4.3. Add Child Flow

```
1. Tap "Add Child" button
   └─> Child form opens (bottom sheet)
       └─> Enter child name
           └─> Tap "Add"
               └─> API: POST /api/families/{id}/children
                   ├─> Success: Show toast, update list
                   └─> Error: Show error message
```

### 4.4. Remove Member Flow

```
1. Long press member card (or tap menu)
   └─> Actions menu opens
       └─> Tap "Remove"
           └─> Confirmation dialog
               └─> Confirm removal
                   └─> API: DELETE /api/families/{id}/members/{userId}
                       └─> Update list
```

## 5. API Integration

### 5.1. Get Family Details

**Endpoint**: `GET /api/families/{familyId}`

**Response:**

```typescript
{
  id: string;
  name: string;
  created_at: string;
  members: Array<{
    user_id: string;
    full_name: string;
    avatar_url: string;
    role: "admin" | "member";
    joined_at: string;
  }>;
  children: Array<{
    id: string;
    name: string;
    created_at: string;
  }>;
}
```

### 5.2. Get Members

**Endpoint**: `GET /api/families/{familyId}/members`

**Response:**

```typescript
{
  members: Array<Member>;
}
```

### 5.3. Get Children

**Endpoint**: `GET /api/families/{familyId}/children`

**Response:**

```typescript
{
  children: Array<Child>;
}
```

### 5.4. Get Invitations

**Endpoint**: `GET /api/families/{familyId}/invitations?status=pending`

**Response:**

```typescript
{
  invitations: Array<{
    id: string;
    invitee_email: string;
    status: "pending" | "accepted" | "expired";
    expires_at: string;
    created_at: string;
  }>;
}
```

### 5.5. Create Invitation

**Endpoint**: `POST /api/families/{familyId}/invitations`

**Request:**

```typescript
{
  invitee_email: string;
}
```

### 5.6. Add Child

**Endpoint**: `POST /api/families/{familyId}/children`

**Request:**

```typescript
{
  name: string;
}
```

## 6. Component Details

### 6.1. Member Card

**Structure:**

```typescript
<MemberCard member={member} isAdmin={isAdmin}>
  <Avatar />
  <MemberInfo>
    <Name />
    <Role />
    <JoinedDate />
  </MemberInfo>
  {isAdmin && <ActionsMenu />}
</MemberCard>
```

**Actions (Admin only):**

- Remove member
- Change role
- View profile

### 6.2. Child Card

**Structure:**

```typescript
<ChildCard child={child} onEdit={handleEdit} onDelete={handleDelete}>
  <ChildName />
  <CreatedDate />
  <SwipeActions>
    <EditAction />
    <DeleteAction />
  </SwipeActions>
</ChildCard>
```

**Swipe Actions (Mobile):**

- Swipe left: Edit
- Swipe right: Delete

### 6.3. Invitation Card

**Structure:**

```typescript
<InvitationCard invitation={invitation} onCancel={handleCancel}>
  <Email />
  <StatusBadge />
  <ExpiryDate />
  <CancelButton />
</InvitationCard>
```

**Status Badges:**

- Pending: Yellow
- Accepted: Green
- Expired: Gray

### 6.4. Invite Member Form

**Bottom Sheet (Mobile):**

```
┌─────────────────────────────────┐
│ Invite Family Member            │
├─────────────────────────────────┤
│                                 │
│ Email address *                 │
│ [________________________]       │
│                                 │
│ They will receive an email      │
│ invitation to join.             │
│                                 │
│ [Cancel]    [Send Invitation]   │
└─────────────────────────────────┘
```

### 6.5. Add Child Form

**Bottom Sheet (Mobile):**

```
┌─────────────────────────────────┐
│ Add Child                       │
├─────────────────────────────────┤
│                                 │
│ Name *                          │
│ [________________________]       │
│                                 │
│ [Cancel]              [Add]     │
└─────────────────────────────────┘
```

## 7. State Management

### 7.1. Family Context

**File**: `src/contexts/FamilyContext.tsx`

```typescript
interface FamilyState {
  currentFamily: Family | null;
  members: Member[];
  children: Child[];
  invitations: Invitation[];
  isLoading: boolean;
  error: Error | null;
}

interface FamilyContextType {
  state: FamilyState;
  loadFamily: (familyId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
  refreshChildren: () => Promise<void>;
  refreshInvitations: () => Promise<void>;
  inviteMember: (email: string) => Promise<void>;
  addChild: (name: string) => Promise<void>;
  removeMember: (userId: string) => Promise<void>;
  removeChild: (childId: string) => Promise<void>;
}
```

### 7.2. React Query Integration

```typescript
export function useFamilyMembers(familyId: string) {
  return useQuery({
    queryKey: ["family-members", familyId],
    queryFn: () => fetchMembers(familyId),
    staleTime: 60000, // 1 minute
  });
}
```

## 8. Mobile-Specific Features

### 8.1. Swipe Actions

**Child Cards:**

- Swipe left: Edit
- Swipe right: Delete
- Haptic feedback

**Member Cards:**

- Long press: Actions menu
- Admin actions only

### 8.2. Bottom Sheets

**Forms:**

- Invite member form
- Add child form
- Edit child form

**Behavior:**

- Swipe down to dismiss
- Confirmation if unsaved changes

## 9. Role-Based UI

### 9.1. Admin Features

- Invite members
- Remove members
- Change member roles
- Delete family (future)

### 9.2. Member Features

- View members
- View children
- Add children
- Cannot invite members (admin only)

### 9.3. UI Indicators

- Role badges on member cards
- Disabled states for non-admin actions
- Tooltips explaining permissions

## 10. Accessibility

### 10.1. WCAG AA Compliance

- **Keyboard Navigation**: All actions keyboard accessible
- **Screen Reader**: Announce role changes, invitations
- **Focus Management**: Focus on new items
- **ARIA Labels**: Proper labels for all actions

### 10.2. ARIA Implementation

```tsx
<div role="list" aria-label="Family members">
  {members.map((member) => (
    <div role="listitem" aria-label={`${member.full_name}, ${member.role}`}>
      <MemberCard member={member} />
    </div>
  ))}
</div>
```

## 11. Performance Optimization

### 11.1. Family Data Loading

- **Lazy Loading**: Family data loaded on demand
- **Caching**: Family members and children cached in React Query
- **Optimistic Updates**: Immediate UI feedback on add/remove

### 11.2. List Rendering

- **Virtual Scrolling**: For large member/child lists
- **Pagination**: Load members/children in batches if needed
- **Debounced Search**: Search debounced to reduce API calls

## 12. Testing Strategy

### 12.1. Unit Tests

- Member card rendering
- Child card rendering
- Invitation status logic
- Role-based UI logic

### 12.2. Integration Tests

- Get family API
- Add child API
- Invite member API
- Remove member API

### 12.3. E2E Tests (Playwright)

- View family overview
- Add child flow
- Invite member flow (admin)
- Remove member flow (admin)

## 13. Dependencies

```json
{
  "@tanstack/react-query": "^5.0.0",
  "react": "^19.1.1",
  "lucide-react": "^0.487.0"
}
```

## 14. Implementation Checklist

### Phase 1: Family Overview

- [ ] Create FamilyOverview component
- [ ] Add family header
- [ ] Display family stats
- [ ] Add navigation to sub-views

### Phase 2: Members List

- [ ] Create MembersList component
- [ ] Create MemberCard component
- [ ] Add role badges
- [ ] Implement admin actions

### Phase 3: Children List

- [ ] Create ChildrenList component
- [ ] Create ChildCard component
- [ ] Add swipe actions (mobile)
- [ ] Implement add/edit/delete

### Phase 4: Invitations List

- [ ] Create InvitationsList component
- [ ] Create InvitationCard component
- [ ] Add status badges
- [ ] Implement cancel action

### Phase 5: Invite Member

- [ ] Create InviteMemberForm component
- [ ] Add email validation
- [ ] Connect to API
- [ ] Handle success/error

### Phase 6: Add Child

- [ ] Create AddChildForm component
- [ ] Add name validation
- [ ] Connect to API
- [ ] Handle success/error

### Phase 7: State Management

- [ ] Create FamilyContext
- [ ] Integrate React Query
- [ ] Implement optimistic updates
- [ ] Add error handling

### Phase 8: Mobile Optimization

- [ ] Optimize touch targets
- [ ] Add swipe gestures
- [ ] Implement bottom sheets
- [ ] Test on devices

### Phase 9: Role Management

- [ ] Add role-based UI
- [ ] Implement permission checks
- [ ] Add role change (admin)
- [ ] Test permissions

### Phase 10: Polish

- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add accessibility features
- [ ] Final testing

## 15. File Structure

```
src/
├── pages/
│   └── family/
│       ├── overview.astro
│       ├── members.astro
│       ├── children.astro
│       └── invitations.astro
├── components/
│   └── family/
│       ├── FamilyOverview.tsx
│       ├── FamilyHeader.tsx
│       ├── MembersList.tsx
│       ├── MemberCard.tsx
│       ├── ChildrenList.tsx
│       ├── ChildCard.tsx
│       ├── InvitationsList.tsx
│       ├── InvitationCard.tsx
│       ├── InviteMemberForm.tsx
│       └── AddChildForm.tsx
├── contexts/
│   └── FamilyContext.tsx
└── hooks/
    ├── useFamily.ts
    ├── useFamilyMembers.ts
    └── useFamilyChildren.ts
```

## 16. Success Criteria

- [ ] User can view family members
- [ ] User can add children
- [ ] User can invite members
- [ ] User can manage invitations
- [ ] Role-based permissions work
- [ ] Mobile experience is smooth
- [ ] Swipe actions work (mobile)
- [ ] Accessibility requirements met
