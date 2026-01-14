# Implementation Plan: Profile View
## Mobile-First Design

## 1. Overview

**Purpose**: Display and manage user profile information and family memberships

**Routes**: 
- `/profile/me` - User profile (default)
- `/profile/families` - Family memberships

**Access**: Available to all users (both admins and regular family members)

**Key Features**:
- View user profile
- Edit profile information
- View family memberships (all families user belongs to)
- Switch between families (if multiple)
- Logout

**Note**: This is different from Settings > Account, which is admin-only and focuses on admin account management.

## 2. Mobile-First Design Specifications

### 2.1. Profile Layout (Mobile)

```
┌─────────────────────────────────┐
│ [←] Profile                     │ ← Header
├─────────────────────────────────┤
│                                 │
│      [Avatar]                   │
│    [Edit Avatar]                │
│                                 │
│  Full Name                      │
│  [John Smith]                   │
│  [Edit]                         │
│                                 │
│  Email                          │
│  john@example.com               │
│  (from Google account)          │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  Family Memberships             │
│  ─────────────────────────────  │
│                                 │
│  ┌───────────────────────────┐ │
│  │ The Smith Family          │ │
│  │ Role: Admin               │ │
│  │ Joined: Jan 2024          │ │
│  └───────────────────────────┘ │
│                                 │
│  ─────────────────────────────  │
│                                 │
│  [Logout]                       │
│                                 │
├─────────────────────────────────┤
│ [📅] [👥] [⚙️] [👤]              │ ← Bottom Nav
└─────────────────────────────────┘
```

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**
- Single column
- Centered avatar
- Full-width sections
- Bottom sheets for editing

**Tablet (768px - 1023px):**
- Two-column (optional)
- Larger avatar
- Modals for editing

**Desktop (1024px+):**
- Multi-column layout
- Sidebar navigation
- Inline editing (optional)

## 3. Component Structure

### 3.1. Profile Component

**File**: `src/components/profile/ProfileView.tsx`

**Structure:**
```typescript
<ProfileView>
  <ProfileHeader />
  <ProfileAvatar />
  <ProfileInfo />
  <FamilyMemberships />
  <LogoutButton />
</ProfileView>
```

### 3.2. Sub-Components

**ProfileAvatar**
- User avatar image
- Edit button
- Default avatar if none

**ProfileInfo**
- Full name
- Email
- Edit button

**FamilyMemberships**
- List of families
- Role in each
- Join date
- Switch family (if multiple)

**EditProfileForm**
- Edit name
- Edit avatar URL
- Save/Cancel buttons

## 4. User Flow

### 4.1. View Profile

```
1. Navigate to Profile
   └─> Profile view loads
       └─> Fetch user data
           └─> Display profile information
               └─> Display family memberships
```

### 4.2. Edit Profile Flow

```
1. Tap "Edit" button
   └─> Edit form opens (bottom sheet)
       └─> Edit name or avatar URL
           └─> Tap "Save"
               └─> API: PATCH /api/users/me
                   ├─> Success: Update display, close form
                   └─> Error: Show error message
```

### 4.3. Switch Family Flow

```
1. View family memberships
   └─> Tap family card
       └─> Switch to that family
           └─> Update family context
               └─> Redirect to calendar
```

### 4.4. Logout Flow

```
1. Tap "Logout" button
   └─> Confirmation dialog
       └─> Confirm logout
           └─> Clear auth state
               └─> Redirect to login
```

## 5. API Integration

### 5.1. Get User Profile

**Endpoint**: `GET /api/users/me`

**Response:**
```typescript
{
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  families: Array<{
    family_id: string;
    family_name: string;
    role: 'admin' | 'member';
    joined_at: string;
  }>;
}
```

### 5.2. Update User Profile

**Endpoint**: `PATCH /api/users/me`

**Request:**
```typescript
{
  full_name?: string;
  avatar_url?: string;
}
```

**Response:**
```typescript
{
  id: string;
  full_name: string;
  avatar_url: string;
  updated_at: string;
}
```

## 6. Component Details

### 6.1. Profile Avatar

**Structure:**
```typescript
<ProfileAvatar avatarUrl={avatarUrl} onEdit={handleEdit}>
  {avatarUrl ? (
    <img src={avatarUrl} alt="Profile" />
  ) : (
    <DefaultAvatar name={fullName} />
  )}
  <EditButton />
</ProfileAvatar>
```

**Default Avatar:**
- Initials from name
- Colored background
- Circular shape

### 6.2. Profile Info

**Structure:**
```typescript
<ProfileInfo
  fullName={fullName}
  email={email}
  onEdit={handleEdit}
>
  <InfoRow label="Full Name" value={fullName} />
  <InfoRow label="Email" value={email} readonly />
  <EditButton />
</ProfileInfo>
```

### 6.3. Family Membership Card

**Structure:**
```typescript
<FamilyMembershipCard
  family={family}
  role={role}
  joinedAt={joinedAt}
  isCurrent={isCurrent}
  onSwitch={handleSwitch}
>
  <FamilyName />
  <RoleBadge />
  <JoinedDate />
  {!isCurrent && <SwitchButton />}
</FamilyMembershipCard>
```

### 6.4. Edit Profile Form

**Bottom Sheet (Mobile):**
```
┌─────────────────────────────────┐
│ Edit Profile                    │
├─────────────────────────────────┤
│                                 │
│ Full Name                       │
│ [________________________]       │
│                                 │
│ Avatar URL                      │
│ [________________________]       │
│                                 │
│ [Cancel]            [Save]      │
└─────────────────────────────────┘
```

## 7. State Management

### 7.1. Profile State

**Auth Context Integration:**
- User profile from AuthContext
- Update profile updates context
- Family memberships from context

### 7.2. React Query Integration

```typescript
export function useUserProfile() {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: fetchUserProfile,
    staleTime: 300000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['user', 'me'], data);
      queryClient.invalidateQueries(['user']);
    },
  });
}
```

## 8. Mobile-Specific Features

### 8.1. Avatar Upload

**Options:**
- URL input (simple)
- Image picker (future)
- Camera capture (future)

**Current Implementation:**
- Text input for avatar URL
- Preview of avatar
- Validation

### 8.2. Bottom Sheet

**Edit Form:**
- Swipe down to dismiss
- Confirmation if unsaved changes
- Full height on mobile

### 8.3. Family Switching

**If Multiple Families:**
- Show all families
- Highlight current family
- Tap to switch
- Confirmation (optional)

## 9. Accessibility

### 9.1. WCAG AA Compliance

- **Keyboard Navigation**: All actions accessible
- **Screen Reader**: Announce profile changes
- **Focus Management**: Focus on edited fields
- **ARIA Labels**: Proper labels

### 9.2. ARIA Implementation

```tsx
<div role="main" aria-label="User profile">
  <img
    src={avatarUrl}
    alt={`${fullName}'s profile picture`}
    aria-label="Profile picture"
  />
  <div>
    <label htmlFor="full-name">Full Name</label>
    <input
      id="full-name"
      value={fullName}
      aria-required="false"
    />
  </div>
</div>
```

## 10. Performance Optimization

### 10.1. Profile Loading

- **Lazy Loading**: Profile data loaded on demand
- **Caching**: Profile cached in React Query
- **Optimistic Updates**: Immediate UI feedback on edit

### 10.2. Avatar Optimization

- **Image Optimization**: Avatar images optimized
- **Lazy Loading**: Avatars loaded on scroll
- **Fallback Handling**: Default avatars without network requests

## 11. Testing Strategy

### 11.1. Unit Tests

- Profile display logic
- Edit form validation
- Family switching logic
- Avatar handling

### 11.2. Integration Tests

- Get user profile API
- Update profile API
- Family memberships API

### 11.3. E2E Tests (Playwright)

- View profile flow
- Edit profile flow
- Switch family flow
- Logout flow

## 12. Dependencies

```json
{
  "@tanstack/react-query": "^5.0.0",
  "react": "^19.1.1",
  "lucide-react": "^0.487.0"
}
```

## 13. Implementation Checklist

### Phase 1: Profile Structure
- [ ] Create ProfileView component
- [ ] Add profile header
- [ ] Display avatar
- [ ] Display profile info

### Phase 2: Profile Display
- [ ] Create ProfileAvatar component
- [ ] Create ProfileInfo component
- [ ] Add default avatar
- [ ] Display email (readonly)

### Phase 3: Edit Profile
- [ ] Create EditProfileForm component
- [ ] Add name input
- [ ] Add avatar URL input
- [ ] Connect to API

### Phase 4: Family Memberships
- [ ] Create FamilyMemberships component
- [ ] Create FamilyMembershipCard component
- [ ] Display families list
- [ ] Add role badges

### Phase 5: Switch Family
- [ ] Implement family switching
- [ ] Update family context
- [ ] Redirect to calendar
- [ ] Handle single family

### Phase 6: Logout
- [ ] Add logout button
- [ ] Implement confirmation dialog
- [ ] Clear auth state
- [ ] Redirect to login

### Phase 7: State Management
- [ ] Integrate with AuthContext
- [ ] Use React Query for profile
- [ ] Implement optimistic updates
- [ ] Add error handling

### Phase 8: Mobile Optimization
- [ ] Optimize touch targets
- [ ] Add bottom sheets
- [ ] Test avatar display
- [ ] Test on devices

### Phase 9: Polish
- [ ] Add loading states
- [ ] Improve error handling
- [ ] Add accessibility features
- [ ] Final testing

## 14. File Structure

```
src/
├── pages/
│   └── profile/
│       ├── me.astro
│       └── families.astro
├── components/
│   └── profile/
│       ├── ProfileView.tsx
│       ├── ProfileAvatar.tsx
│       ├── ProfileInfo.tsx
│       ├── EditProfileForm.tsx
│       ├── FamilyMemberships.tsx
│       ├── FamilyMembershipCard.tsx
│       └── LogoutButton.tsx
├── hooks/
│   ├── useUserProfile.ts
│   └── useUpdateProfile.ts
└── lib/
    └── profile/
        └── avatarUtils.ts
```

## 15. Success Criteria

- [ ] User can view profile
- [ ] User can edit profile
- [ ] User can view family memberships
- [ ] User can switch families (if multiple)
- [ ] User can logout
- [ ] Mobile experience is smooth
- [ ] Avatar displays correctly
- [ ] Accessibility requirements met

