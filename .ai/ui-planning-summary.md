# UI Planning Summary - Home Planner MVP

## Mobile-First Implementation Guide

## Overview

This document summarizes the UI architecture, user journeys, and navigation structure for the Home Planner MVP, with a strong emphasis on mobile-first design.

## Key Documents

1. **UI Architecture** (`.ai/ui-architecture.md`)
   - Component architecture
   - State management strategy
   - Responsive design specifications
   - Performance optimization
   - Accessibility requirements

2. **User Journey Maps** (`.ai/user-journey-maps.md`)
   - Detailed user flows
   - Mobile-specific interactions
   - Error handling journeys
   - Accessibility journeys

3. **Navigation Structure** (`.ai/navigation-structure.md`)
   - Route hierarchy
   - Mobile bottom navigation
   - Desktop sidebar navigation
   - Deep linking patterns

## Core Design Principles

### Mobile-First

- **Primary Target**: Mobile devices (320px - 768px)
- **Touch Targets**: Minimum 44x44px
- **Navigation**: Bottom navigation bar (always accessible)
- **Forms**: Bottom sheets (native mobile pattern)
- **Gestures**: Swipe for quick actions

### Component Library

- **Base**: Shadcn/ui components
- **Custom**: Mobile-optimized variants
- **Icons**: Lucide React
- **Styling**: Tailwind 4 (mobile-first utilities)

## Key UI Components

### Navigation

- **BottomNav**: Fixed bottom navigation (mobile)
- **SidebarNav**: Collapsible sidebar (desktop)
- **Header**: Contextual top header

### Calendar Views

- **DayView**: Vertical timeline (mobile-optimized)
- **WeekView**: Horizontal scrollable days
- **MonthView**: Grid layout with event indicators
- **AgendaView**: List of upcoming events

### Forms

- **EventForm**: Bottom sheet (mobile), modal (desktop)
- **InviteMemberForm**: Bottom sheet
- **RecurrenceEditor**: Collapsible section

### Family Management

- **MemberList**: Cards with avatars
- **ChildrenList**: Swipeable cards
- **InvitationList**: Status badges

### External Calendars

- **CalendarCard**: Connection status
- **ConnectCalendarFlow**: OAuth integration
- **SyncStatus**: Real-time sync indicators

## State Management

### Global Contexts

- **AuthContext**: User authentication
- **FamilyContext**: Family data
- **CalendarContext**: Events and filters
- **ExternalCalendarContext**: Calendar connections

### Server State

- **React Query / SWR**: API data caching
- **Optimistic Updates**: Immediate UI feedback
- **Auto-refetch**: On focus/reconnect

## User Flows

### Primary Flows

1. **Onboarding**: 4-step wizard (skippable)
2. **Create Event**: Quick form with conflict detection
3. **Sync Calendar**: Manual/automatic sync
4. **Invite Member**: Simple email form
5. **View Calendar**: Multiple view options

### Mobile-Specific Interactions

- **Swipe Left**: Edit event
- **Swipe Right**: Delete event
- **Pull Down**: Refresh/sync
- **Long Press**: Quick actions menu
- **Double Tap**: View details

## Responsive Breakpoints

### Mobile (320px - 767px)

- Single column layout
- Bottom navigation
- Bottom sheets for modals
- Full-width components
- Touch-optimized targets

### Tablet (768px - 1023px)

- Two-column where appropriate
- Sidebar navigation (optional)
- Modals instead of bottom sheets
- Larger touch targets

### Desktop (1024px+)

- Multi-column layouts
- Sidebar navigation (always visible)
- Modals and side panels
- Hover states
- Keyboard shortcuts

## Performance Targets

### Mobile Performance

- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1

### Optimization Strategies

- Code splitting (route-based)
- Lazy loading (components)
- Skeleton screens
- Optimistic updates
- Service worker caching

## Accessibility

### WCAG AA Compliance

- Color contrast: 4.5:1 minimum
- Keyboard navigation: Full support
- Screen readers: VoiceOver/TalkBack
- Touch targets: 44x44px minimum
- Font scaling: Up to 200%

### Mobile Accessibility

- VoiceOver (iOS) support
- TalkBack (Android) support
- Reduced motion preferences
- High contrast mode

## Error Handling

### Error States

- **Network Error**: Retry button, offline indicator
- **Validation Error**: Field-level messages
- **Conflict Error**: Show conflicting events
- **Rate Limit**: Retry timer
- **Server Error**: Generic message with support

### Loading States

- **Skeleton Screens**: For initial loads
- **Spinners**: For async operations
- **Progress Bars**: For sync operations

## Implementation Phases

### Phase 1: Core Infrastructure

- Authentication flow
- Navigation structure
- State management
- API client
- Error handling

### Phase 2: Calendar Views

- Day/Week/Month/Agenda views
- View switcher
- Event cards
- Filters

### Phase 3: Event Management

- Create/edit forms
- Conflict detection UI
- Recurrence editor
- Delete functionality

### Phase 4: Family Management

- Family overview
- Members/children lists
- Invitation system

### Phase 5: External Calendars

- Connection flow
- Calendar list
- Sync functionality

### Phase 6: Onboarding

- Wizard steps
- Progress tracking
- Skip functionality

### Phase 7: Polish

- Responsive refinements
- Performance optimization
- Accessibility improvements
- Error state handling

## File Structure

```
src/
├── components/
│   ├── ui/              # Shadcn/ui components
│   ├── calendar/        # Calendar components
│   ├── family/          # Family management
│   ├── external-calendars/
│   ├── onboarding/
│   ├── navigation/
│   ├── layout/
│   └── shared/
├── contexts/            # React contexts
├── hooks/               # Custom hooks
└── lib/
    ├── api/            # API utilities
    └── utils/
```

## Next Steps

1. **Review** all planning documents
2. **Set up** component library (Shadcn/ui)
3. **Implement** navigation structure
4. **Create** core components
5. **Build** calendar views
6. **Integrate** API endpoints
7. **Test** on mobile devices
8. **Optimize** performance
9. **Improve** accessibility
10. **Polish** user experience

## Key Decisions

### Mobile-First Rationale

- Primary use case is mobile (family scheduling on-the-go)
- Mobile constraints force simplicity
- Desktop enhances mobile patterns

### Bottom Navigation

- Always accessible
- Thumb-friendly zone
- Clear visual hierarchy

### Bottom Sheets

- Native mobile pattern
- Contextual (doesn't block screen)
- Easy to dismiss

### Optimistic Updates

- Immediate feedback
- Better perceived performance
- Rollback on error

## Success Metrics

### User Experience

- Onboarding completion: > 80%
- Event creation success: > 95%
- Calendar sync success: > 99%
- Touch target accuracy: > 95%

### Performance

- Load time (3G): < 3s
- Time to interactive: < 3.5s
- First contentful paint: < 1.5s

### Accessibility

- WCAG AA compliance
- Screen reader support
- Keyboard navigation
- Touch accessibility

## Resources

- **Design System**: Shadcn/ui
- **Icons**: Lucide React
- **Styling**: Tailwind 4
- **State**: React Context + React Query
- **Testing**: Vitest + Playwright
- **API**: REST API (see api-plan.md)
