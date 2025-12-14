# View Plans Verification Report

## Executive Summary

This report identifies mismatches between view implementation plans and the PRD, API plan, UI architecture, and authentication plan. All issues are categorized by severity and include recommended fixes.

---

## 🔴 CRITICAL MISMATCHES

### 1. Event Management: Conflict Prevention vs Warning

**Location**: `plan-view-events.md` Section 4.1, 8.1

**Issue**: 
- Plan states: "User adjusts or saves anyway" for blocker conflicts
- PRD Section 3.4 states: "Blocker events are rigid and cannot be scheduled over an existing Blocker event. The UI will **prevent saving** a conflicting Blocker event"
- API Plan Section 4.2: Returns `409 Conflict` for blocker conflicts

**Mismatch**: Plan allows saving with warning, but PRD/API require prevention.

**Recommendation**: 
- Update plan to **prevent saving** blocker events with conflicts
- Show warning but disable Save button
- Remove "Save anyway" option
- Only allow saving after user adjusts time to resolve conflict

---

### 2. Authentication: OAuth Callback Route Mismatch

**Location**: `plan-view-authentication.md` Section 5.2

**Issue**:
- Plan shows client-side callback handler at `/auth/callback.ts`
- Plan shows checking `hasCompletedOnboarding` field
- API Plan `/api/users/me` response doesn't include `hasCompletedOnboarding` field

**Mismatch**: 
- Supabase Auth handles OAuth differently (client-side redirect)
- Need to determine onboarding status from user profile or family membership

**Recommendation**:
- Clarify that Supabase Auth handles OAuth callback client-side
- Check onboarding status by:
  - Checking if user has any families (GET /api/users/me includes families array)
  - If no families → redirect to onboarding
  - If has families → redirect to calendar

---

### 3. Event Management: Recurrence Scope Naming Inconsistency

**Location**: `plan-view-events.md` Section 4.2

**Issue**:
- Plan shows: "This event only", "This and future", "All events"
- API Plan Section 2.6.4 shows: `scope: 'this' | 'future' | 'all'` (lowercase)

**Mismatch**: UI labels don't match API parameter values.

**Recommendation**:
- Keep user-friendly labels in UI ("This event only", etc.)
- Map to API values: `'this'`, `'future'`, `'all'`
- Document the mapping clearly

---

## 🟡 MODERATE MISMATCHES

### 4. Calendar View: Query Parameter Format

**Location**: `plan-view-calendar.md` Section 5.1

**Issue**:
- Plan shows: `participant_ids?: string[]` (array)
- API Plan Section 2.6.1 shows: `participant_ids` as comma-separated string in query params

**Mismatch**: TypeScript type vs actual HTTP query parameter format.

**Recommendation**:
- Update plan to show: `participant_ids?: string` (comma-separated)
- Document that client converts array to comma-separated string
- Example: `participant_ids: ['id1', 'id2'].join(',')`

---

### 5. Event Management: Edit Route vs Modal

**Location**: `plan-view-events.md` Section 1

**Issue**:
- Plan mentions: `/events/:eventId/edit` as optional route
- UI Architecture Section 3.3: Shows "Modal/bottom sheet overlay"
- Plan Section 1: Also mentions "Modal/bottom sheet overlay"

**Mismatch**: Inconsistent routing approach.

**Recommendation**:
- Remove `/events/:eventId/edit` route from plan
- Use modal/bottom sheet overlay only (matches UI architecture)
- Update plan to be consistent: "Event editing: Modal/bottom sheet overlay"

---

### 6. Settings: Account Tab Duplication

**Location**: `plan-view-settings.md` Section 3.2, 6.5

**Issue**:
- Settings plan includes "AccountTab" with profile, family memberships, logout
- Profile plan (`plan-view-profile.md`) has dedicated routes for same features
- UI Architecture shows Profile as separate navigation item

**Mismatch**: Duplicate functionality between Settings and Profile.

**Recommendation**:
- Remove AccountTab from Settings
- Keep Settings focused on: External Calendars, App Preferences
- Profile remains separate navigation item with its own routes
- Update Settings plan to remove AccountTab section

---

### 7. Family Management: Invite Permissions

**Location**: `plan-view-family.md` Section 9.2

**Issue**:
- Plan states: "Invite members (all members can invite)"
- PRD Section 3.1: "All adult Members have permission to create and update events" (doesn't explicitly mention invitations)
- API Plan: No restriction on invitation creation endpoint

**Mismatch**: Plan adds permission not explicitly in PRD.

**Recommendation**:
- Verify with PRD: Should all members be able to invite?
- If yes: Add to PRD Section 3.1 explicitly
- If no: Update plan to show admin-only invitation (matches "Invite Adult Family Member" user story)

---

## 🟢 MINOR ISSUES / CLARIFICATIONS

### 8. Authentication: Onboarding Status Check

**Location**: `plan-view-authentication.md` Section 5.2

**Issue**:
- Plan shows checking `user.hasCompletedOnboarding`
- API response doesn't include this field

**Recommendation**:
- Use family membership check instead:
  ```typescript
  const user = await getUserProfile(data.user.id);
  const hasFamily = user.families && user.families.length > 0;
  if (!hasFamily) {
    return redirect('/onboarding/welcome');
  }
  ```

---

### 9. Calendar View: Default View Route

**Location**: `plan-view-calendar.md` Section 1

**Issue**:
- Plan shows `/calendar/week` as default
- Need to verify this matches UI architecture

**Status**: ✅ Matches UI Architecture Section 2.1 (Calendar as default landing)

---

### 10. Onboarding: Step Order Consistency

**Location**: `plan-view-onboarding.md` vs PRD Section 3.6

**Issue**:
- Plan steps: 1) Welcome, 2) Connect Calendar, 3) Add Children, 4) Invite Members
- PRD: "account creation, connecting their first calendar, and inviting family members"

**Status**: ✅ Plan is more detailed, PRD is high-level. Plan is correct.

---

### 11. Profile: Route Structure

**Location**: `plan-view-profile.md` Section 1

**Issue**:
- Plan shows: `/profile/me` and `/profile/families`
- UI Architecture shows Profile as single navigation item

**Recommendation**:
- Consider single route `/profile` with tabs/sections
- Or keep separate routes if needed for deep linking
- Document routing decision

---

## 📋 MISSING ELEMENTS

### 12. Event Management: Synced Event Read-Only Handling

**Location**: `plan-view-events.md`

**Issue**:
- Plan doesn't explicitly mention handling synced events (read-only)
- PRD Section 3.5: "Events synced from external calendars are strictly read-only"
- API Plan: Returns `403 Forbidden` for synced event updates/deletes

**Recommendation**:
- Add section on synced event handling:
  - Disable edit/delete buttons for synced events
  - Show visual indicator (already in plan)
  - Show message: "This event is synced from [Provider] and cannot be edited"

---

### 13. Calendar View: Multi-Day Event Banner

**Location**: `plan-view-calendar.md` Section 7.1

**Issue**:
- Plan mentions "Multi-day banner" in Day View
- PRD Section 3.2: "Multi-day events will be displayed as a banner at the top of the calendar view"
- Plan doesn't show implementation details

**Recommendation**:
- Add detailed specification for multi-day event banner:
  - Position: Top of calendar view (above all-day section)
  - Display: Event title, date range, participants
  - Interaction: Tap to view details

---

### 14. Settings: OAuth Callback Handling

**Location**: `plan-view-settings.md` Section 4.1

**Issue**:
- Plan shows OAuth flow but doesn't detail callback handling
- API Plan shows `/api/external-calendars/callback` redirects to frontend

**Recommendation**:
- Add callback handling section:
  - Frontend receives redirect with `?status=success&calendar_id=...` or `?status=error&error=...`
  - Show success toast and refresh calendar list
  - Handle error states with user-friendly messages

---

## 🔄 CONSISTENCY ISSUES

### 15. Navigation Structure

**Location**: All plans

**Issue**:
- All plans show bottom navigation: `[📅] [👥] [⚙️] [👤]`
- UI Architecture Section 2.1 confirms this structure
- Some plans show different header structures

**Status**: ✅ Consistent across all plans

---

### 16. Mobile-First Breakpoints

**Location**: All plans

**Issue**:
- All plans use: Mobile (320-767px), Tablet (768-1023px), Desktop (1024px+)
- UI Architecture Section 7 confirms these breakpoints

**Status**: ✅ Consistent

---

### 17. Touch Target Sizes

**Location**: Multiple plans

**Issue**:
- Plans mention: 44x44px minimum (some say 48x48px)
- UI Architecture Section 8.1: "Minimum 44x44px touch targets"
- Some plans (authentication) say 48px for buttons

**Recommendation**:
- Standardize: 44x44px minimum (WCAG AA)
- 48px for primary action buttons (better UX)
- Document: "Minimum 44x44px, recommended 48x48px for primary actions"

---

## ✅ VERIFIED CORRECT

### 18. API Endpoints Match

**Status**: ✅ All API endpoints in plans match API plan:
- Events: `POST /api/events`, `PATCH /api/events/:id`, `DELETE /api/events/:id`
- Families: `GET /api/families/:id`, `POST /api/families/:id/children`
- External Calendars: `GET /api/external-calendars`, `POST /api/external-calendars`
- Users: `GET /api/users/me`, `PATCH /api/users/me`

### 19. Event Types Match

**Status**: ✅ All plans use 'elastic' | 'blocker' matching PRD and API plan

### 20. Recurrence Patterns Match

**Status**: ✅ All plans use 'daily' | 'weekly' | 'monthly' matching PRD and API plan

---

## 📝 RECOMMENDATIONS SUMMARY

### High Priority (Fix Before Implementation)

1. **Fix blocker event conflict handling** - Prevent saving, don't allow "save anyway"
2. **Clarify authentication callback flow** - Document Supabase Auth client-side handling
3. **Remove AccountTab from Settings** - Avoid duplication with Profile view
4. **Add synced event read-only handling** - Disable edit/delete for synced events

### Medium Priority (Clarify During Implementation)

5. **Standardize touch target sizes** - Document 44px minimum, 48px recommended
6. **Clarify invite permissions** - Verify with PRD if all members can invite
7. **Add multi-day event banner spec** - Detailed implementation guide
8. **Add OAuth callback handling** - Frontend redirect handling details

### Low Priority (Documentation Improvements)

9. **Update query parameter format** - Document array to string conversion
10. **Remove optional edit route** - Use modal/bottom sheet only
11. **Clarify onboarding status check** - Use family membership instead of field

---

## Questions for Product Owner - ✅ RESOLVED

1. **Invitation Permissions**: ✅ **RESOLVED** - Only family admins can invite members
2. **Blocker Conflicts**: ✅ **RESOLVED** - Blocker events must be prevented from saving when conflicts exist
3. **Settings vs Profile**: ✅ **RESOLVED** - Settings AccountTab is admin-only, Profile is for all users
4. **Onboarding Status**: ✅ **RESOLVED** - Check family membership (user has families = completed)

---

## Updates Applied

All plans have been updated based on product owner decisions:

1. ✅ **plan-view-events.md**: Updated conflict handling to prevent saving blocker events with conflicts
2. ✅ **plan-view-family.md**: Updated to show only admins can invite members
3. ✅ **plan-view-settings.md**: Clarified AccountTab is admin-only
4. ✅ **plan-view-authentication.md**: Fixed onboarding check to use family membership
5. ✅ **plan-view-profile.md**: Clarified it's for all users (not admin-only)

---

## Next Steps

1. ✅ Plans updated with approved changes
2. Review updated plans
3. Proceed with implementation

