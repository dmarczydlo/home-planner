# Navigation Structure - Home Planner MVP

## Mobile-First Navigation Design

## 1. Route Structure

### 1.1. Route Hierarchy

```
/ (root)
├── /auth
│   ├── /login                    # Google Sign-in
│   └── /callback                 # OAuth callback handler
│
├── /onboarding                  # Onboarding wizard
│   ├── /welcome                 # Step 1: Family name
│   ├── /connect-calendar        # Step 2: Connect calendar
│   ├── /add-children            # Step 3: Add children
│   └── /invite-members          # Step 4: Invite members
│
├── /calendar                    # Main calendar (default)
│   ├── /day                     # Day view
│   ├── /week                    # Week view (default)
│   ├── /month                   # Month view
│   └── /agenda                  # Agenda view
│
├── /family                      # Family management
│   ├── /overview                # Family overview
│   ├── /members                 # Members list
│   ├── /children                # Children list
│   └── /invitations             # Invitations list
│
├── /settings                    # Settings
│   ├── /calendars               # External calendars
│   ├── /preferences             # App preferences
│   └── /account                 # Account settings
│
└── /profile                     # User profile
    ├── /me                      # Profile details
    └── /families                # Family memberships
```

### 1.2. Route Parameters

```
/calendar/:view?                 # view: day|week|month|agenda
/calendar/:view/:date?           # date: YYYY-MM-DD
/events/:eventId                 # Event detail view
/family/:familyId?               # Optional family ID
/invitations/:token              # Public invitation acceptance
```

## 2. Mobile Navigation (Primary)

### 2.1. Bottom Navigation Bar

**Component**: `BottomNav.tsx`

**Structure:**

```
┌─────────────────────────────────────┐
│                                     │
│      [Main Content Area]            │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ [📅]  [👥]  [⚙️]  [👤]              │
│Calendar Family Settings Profile     │
└─────────────────────────────────────┘
```

**Navigation Items:**

1. **Calendar** (📅)
   - **Route**: `/calendar/week` (default)
   - **Active State**: Blue fill, label visible
   - **Inactive State**: Gray outline, label visible
   - **Badge**: None (or sync status indicator)

2. **Family** (👥)
   - **Route**: `/family/overview`
   - **Active State**: Blue fill
   - **Inactive State**: Gray outline
   - **Badge**: Pending invitations count (if > 0)

3. **Settings** (⚙️)
   - **Route**: `/settings/calendars`
   - **Active State**: Blue fill
   - **Inactive State**: Gray outline
   - **Badge**: Sync error indicator (if any)

4. **Profile** (👤)
   - **Route**: `/profile/me`
   - **Active State**: Blue fill
   - **Inactive State**: Gray outline
   - **Badge**: None

**Implementation Details:**

- Fixed position at bottom
- Height: 64px (48px content + 8px safe area)
- Background: White with shadow
- Safe area padding for notched devices
- Haptic feedback on tap
- Smooth transitions between routes

### 2.2. Top Navigation (Contextual)

**Component**: `Header.tsx`

**Structure:**

```
┌─────────────────────────────────────┐
│ [☰]  Calendar          [🔄] [⚙️]  │
└─────────────────────────────────────┘
```

**Elements:**

- **Menu Button** (☰): Opens side menu (mobile) or shows sidebar (desktop)
- **Title**: Context-aware (e.g., "Calendar", "Family", "Settings")
- **Actions**: Context-specific (e.g., sync button, filter toggle)

**Variations by View:**

**Calendar View:**

```
┌─────────────────────────────────────┐
│ [☰]  Week View    [🔍] [🔄] [⚙️]   │
└─────────────────────────────────────┘
```

- Filter toggle (🔍)
- Sync button (🔄)
- View settings (⚙️)

**Family View:**

```
┌─────────────────────────────────────┐
│ [←]  Family        [+ Invite]       │
└─────────────────────────────────────┘
```

- Back button (if nested)
- Action button (context-specific)

**Settings View:**

```
┌─────────────────────────────────────┐
│ [←]  Settings                       │
└─────────────────────────────────────┘
```

- Back button only

## 3. Desktop Navigation (Secondary)

### 3.1. Sidebar Navigation

**Component**: `SidebarNav.tsx`

**Structure:**

```
┌─────┬──────────────────────────────┐
│ 📅  │    [Main Content Area]        │
│ 👥  │                               │
│ ⚙️  │                               │
│ 👤  │                               │
└─────┴──────────────────────────────┘
```

**Navigation Items:**

- Same items as bottom nav
- Vertical layout
- Icons + labels
- Collapsible (optional)

**Width:**

- Expanded: 240px
- Collapsed: 64px (icons only)

### 3.2. Breadcrumb Navigation

**Component**: `Breadcrumb.tsx`

**Usage**: For nested routes (e.g., Family > Members > Invite)

**Example:**

```
Family > Members > Invite Member
```

## 4. Navigation Components

### 4.1. BottomNav Component

```typescript
// src/components/navigation/BottomNav.tsx

interface BottomNavProps {
  currentRoute: string;
}

export function BottomNav({ currentRoute }: BottomNavProps) {
  const navItems = [
    { icon: Calendar, label: 'Calendar', route: '/calendar/week' },
    { icon: Users, label: 'Family', route: '/family/overview' },
    { icon: Settings, label: 'Settings', route: '/settings/calendars' },
    { icon: User, label: 'Profile', route: '/profile/me' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavItem
            key={item.route}
            {...item}
            isActive={currentRoute.startsWith(item.route)}
          />
        ))}
      </div>
    </nav>
  );
}
```

### 4.2. NavItem Component

```typescript
// src/components/navigation/NavItem.tsx

interface NavItemProps {
  icon: React.ComponentType;
  label: string;
  route: string;
  isActive: boolean;
  badge?: number | string;
}

export function NavItem({ icon: Icon, label, route, isActive, badge }: NavItemProps) {
  return (
    <Link
      href={route}
      className={cn(
        'flex flex-col items-center justify-center flex-1 h-full',
        'transition-colors',
        isActive ? 'text-blue-600' : 'text-gray-500'
      )}
    >
      <div className="relative">
        <Icon className={cn('w-6 h-6', isActive && 'fill-current')} />
        {badge && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {badge}
          </span>
        )}
      </div>
      <span className={cn('text-xs mt-1', isActive && 'font-medium')}>
        {label}
      </span>
    </Link>
  );
}
```

### 4.3. Header Component

```typescript
// src/components/layout/Header.tsx

interface HeaderProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function Header({ title, showBack, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          {showBack && (
            <button onClick={() => window.history.back()}>
              <ArrowLeft className="w-6 h-6" />
            </button>
          )}
          <h1 className="text-lg font-semibold">{title}</h1>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
```

## 5. Navigation State Management

### 5.1. Active Route Detection

```typescript
// src/hooks/useActiveRoute.ts

export function useActiveRoute() {
  const [pathname] = usePathname();

  return {
    currentRoute: pathname,
    isCalendarRoute: pathname.startsWith("/calendar"),
    isFamilyRoute: pathname.startsWith("/family"),
    isSettingsRoute: pathname.startsWith("/settings"),
    isProfileRoute: pathname.startsWith("/profile"),
  };
}
```

### 5.2. Navigation Guards

```typescript
// src/middleware/navigation.ts

export function requireAuth(route: string): boolean {
  // Check if route requires authentication
  const protectedRoutes = ["/calendar", "/family", "/settings", "/profile"];
  return protectedRoutes.some((r) => route.startsWith(r));
}

export function requireOnboarding(route: string): boolean {
  // Check if user needs to complete onboarding
  return route !== "/onboarding" && !userHasCompletedOnboarding();
}
```

## 6. Deep Linking & URL Structure

### 6.1. Deep Link Patterns

**Event Detail:**

```
/calendar/week/2024-01-15?event=abc123
```

**Invitation Acceptance:**

```
/invitations/abc123def456
```

**Calendar with Filters:**

```
/calendar/week?participants=user1,user2&type=blocker
```

**Date Navigation:**

```
/calendar/day/2024-01-15
/calendar/week/2024-01-15
/calendar/month/2024-01
```

### 6.2. URL Query Parameters

**Calendar View:**

- `view`: `day|week|month|agenda`
- `date`: `YYYY-MM-DD`
- `participants`: Comma-separated IDs
- `type`: `elastic|blocker`
- `event`: Event ID (for detail view)

**Family View:**

- `family`: Family ID (if multiple families)

**Settings View:**

- `tab`: `calendars|preferences|account`

## 7. Navigation Transitions

### 7.1. Mobile Transitions

**Bottom Nav:**

- Fade transition (200ms)
- Active state highlight animation

**Route Changes:**

- Slide transition (300ms)
- Direction: Left (forward), Right (back)

**Bottom Sheet:**

- Slide up from bottom (300ms)
- Backdrop fade (200ms)

### 7.2. Desktop Transitions

**Sidebar:**

- Width transition (200ms)
- Content shift (300ms)

**Route Changes:**

- Fade transition (200ms)
- No slide (less jarring on large screens)

## 8. Navigation Accessibility

### 8.1. Keyboard Navigation

**Bottom Nav (Desktop):**

- Tab: Navigate between items
- Enter/Space: Activate item
- Arrow keys: Navigate between items

**Skip Links:**

```html
<a href="#main-content" class="sr-only focus:not-sr-only"> Skip to main content </a>
```

### 8.2. Screen Reader Support

**Navigation Announcements:**

- "Navigation, Calendar selected"
- "Family, 2 pending invitations"
- "Settings, 1 sync error"

**ARIA Labels:**

```tsx
<nav aria-label="Main navigation">
  <button aria-label="Calendar, current page">
    <CalendarIcon />
    <span>Calendar</span>
  </button>
</nav>
```

## 9. Navigation Patterns by Screen Size

### 9.1. Mobile (< 768px)

**Primary Navigation:**

- Bottom navigation bar (always visible)
- Top header (contextual)

**Secondary Navigation:**

- Hamburger menu (if needed)
- Drawer/sidebar (slide from left)

**Gestures:**

- Swipe between views
- Pull to refresh

### 9.2. Tablet (768px - 1023px)

**Primary Navigation:**

- Bottom navigation (optional, can switch to sidebar)
- Top header

**Secondary Navigation:**

- Sidebar (collapsible)
- Tabs for sub-sections

### 9.3. Desktop (1024px+)

**Primary Navigation:**

- Sidebar (always visible)
- Top header

**Secondary Navigation:**

- Tabs for sub-sections
- Breadcrumbs for deep navigation

## 10. Navigation State Persistence

### 10.1. Route Persistence

**Local Storage:**

```typescript
// Save last route
localStorage.setItem("lastRoute", "/calendar/week");

// Restore on app load
const lastRoute = localStorage.getItem("lastRoute") || "/calendar/week";
```

### 10.2. View State Persistence

**Calendar View:**

- Last selected view (day/week/month/agenda)
- Last selected date
- Filter preferences

**Family View:**

- Last selected family (if multiple)

## 11. Navigation Error Handling

### 11.1. Invalid Routes

**404 Handling:**

```typescript
// Redirect to default route
if (!isValidRoute(pathname)) {
  navigate("/calendar/week");
}
```

### 11.2. Protected Route Access

**Auth Required:**

```typescript
if (requireAuth(pathname) && !isAuthenticated) {
  navigate("/auth/login", { replace: true });
}
```

**Onboarding Required:**

```typescript
if (requireOnboarding(pathname) && !hasCompletedOnboarding) {
  navigate("/onboarding/welcome", { replace: true });
}
```

## 12. Navigation Performance

### 12.1. Route Preloading

**Prefetch on Hover (Desktop):**

```typescript
<Link
  href="/family/overview"
  onMouseEnter={() => prefetch('/family/overview')}
>
  Family
</Link>
```

### 12.2. Code Splitting

**Route-based Splitting:**

```typescript
const CalendarView = lazy(() => import("./pages/CalendarView"));
const FamilyView = lazy(() => import("./pages/FamilyView"));
```

## 13. Navigation Testing

### 13.1. Navigation Tests

**Unit Tests:**

- Active route detection
- Navigation item rendering
- Badge counts

**Integration Tests:**

- Route transitions
- Navigation guards
- Deep linking

**E2E Tests:**

- Complete user flows
- Navigation between views
- Mobile gestures

## 14. Navigation Implementation Checklist

### Phase 1: Core Navigation

- [ ] Bottom navigation component
- [ ] Route structure setup
- [ ] Active route detection
- [ ] Navigation guards

### Phase 2: Contextual Navigation

- [ ] Header component
- [ ] Breadcrumbs
- [ ] Action buttons

### Phase 3: Desktop Navigation

- [ ] Sidebar component
- [ ] Responsive navigation switching
- [ ] Collapsible sidebar

### Phase 4: Advanced Features

- [ ] Deep linking
- [ ] Route persistence
- [ ] Navigation transitions
- [ ] Accessibility improvements
