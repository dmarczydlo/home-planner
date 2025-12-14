# Implementation Plan: Authentication View

## Mobile-First Design

## 1. Overview

**Purpose**: Handle user authentication via Google Sign-in (OAuth 2.0)

**Route**: `/auth/login`

**Entry Point**: Landing page for unauthenticated users

**Exit Point**: Redirects to onboarding (first-time) or calendar view (returning users)

## 2. Mobile-First Design Specifications

### 2.1. Layout (Mobile 320px - 767px)

```
┌─────────────────────────────────┐
│                                 │
│      [App Logo/Branding]        │
│                                 │
│    "Home Planner"              │
│    "Organize your family"      │
│                                 │
│                                 │
│  ┌───────────────────────────┐ │
│  │  Sign in with Google      │ │
│  │  [Google Icon]            │ │
│  └───────────────────────────┘ │
│                                 │
│    [Privacy Policy Link]       │
│    [Terms of Service Link]      │
│                                 │
└─────────────────────────────────┘
```

**Key Elements:**

- Full-screen centered layout
- Large, thumb-friendly button (minimum 48px height)
- Clear branding
- Minimal distractions

### 2.2. Responsive Breakpoints

**Mobile (320px - 767px):**

- Full-width button
- Centered content
- Padding: 24px

**Tablet (768px - 1023px):**

- Constrained width (max 400px)
- Centered container
- Padding: 32px

**Desktop (1024px+):**

- Constrained width (max 480px)
- Centered container
- Padding: 40px

## 3. Component Structure

### 3.1. Main Component

**File**: `src/pages/auth/login.astro` or `src/components/auth/LoginView.tsx`

**Structure:**

```typescript
<LoginView>
  <LoginContainer>
    <Branding />
    <GoogleSignInButton />
    <LegalLinks />
  </LoginContainer>
</LoginView>
```

### 3.2. Sub-Components

**Branding Component**

- App logo/icon
- App name
- Tagline

**GoogleSignInButton Component**

- Google icon
- "Sign in with Google" text
- Loading state
- Error state

**LegalLinks Component**

- Privacy Policy link
- Terms of Service link
- Footer text

## 4. User Flow

### 4.1. Happy Path

```
1. User lands on /auth/login
   └─> Display login page
       └─> User taps "Sign in with Google"
           └─> Initiate OAuth flow
               └─> Redirect to Google
                   └─> User authenticates
                       └─> Google redirects back
                           └─> Handle OAuth callback
                               ├─> First-time user: /onboarding/welcome
                               └─> Returning user: /calendar/week
```

### 4.2. Error Handling

```
OAuth Error
└─> Display error message
    └─> Show "Try again" button
        └─> Retry OAuth flow

Network Error
└─> Display offline message
    └─> Show retry option

Invalid State
└─> Redirect to login
    └─> Show error toast
```

## 5. API Integration

### 5.1. Authentication Flow

**Supabase Auth Integration:**

```typescript
// src/lib/auth/supabaseAuth.ts
import { createClient } from "@supabase/supabase-js";

export async function signInWithGoogle() {
  const supabase = createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) throw error;
  return data;
}
```

### 5.2. OAuth Callback Handler

**Route**: `/auth/callback`

**Handler**: `src/pages/auth/callback.ts`

```typescript
export async function GET({ url, cookies }: APIContext) {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  if (error) {
    return redirect('/auth/login?error=auth_failed');
  }

  if (!code) {
    return redirect('/auth/login?error=no_code');
  }

  // Exchange code for session
  const supabase = createClient(...);
  const { data, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return redirect('/auth/login?error=session_failed');
  }

  // Check if user has completed onboarding (has at least one family)
  const user = await getUserProfile(data.user.id);

  if (!user) {
    return redirect('/auth/login?error=user_not_found');
  }

  // Check onboarding status: user has families = completed onboarding
  const hasCompletedOnboarding = user.families && user.families.length > 0;

  if (!hasCompletedOnboarding) {
    return redirect('/onboarding/welcome');
  }

  return redirect('/calendar/week');
}
```

## 6. State Management

### 6.1. Auth Context

**File**: `src/contexts/AuthContext.tsx`

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
```

### 6.2. Auth Hook

**File**: `src/hooks/useAuth.ts`

```typescript
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

## 7. Mobile-Specific Features

### 7.1. Touch Optimization

- **Button Size**: Minimum 48x48px touch target
- **Spacing**: Adequate padding around button
- **Haptic Feedback**: On button press (if available)

### 7.2. Loading States

**During OAuth:**

- Show loading spinner
- Disable button
- Display "Redirecting to Google..."

**After Redirect:**

- Show loading screen
- Display "Signing you in..."

### 7.3. Error States

**Error Messages:**

- Network error: "Connection failed. Please check your internet."
- Auth error: "Sign in failed. Please try again."
- Generic error: "Something went wrong. Please try again."

**Error Display:**

- Toast notification (mobile-friendly)
- Inline error message
- Retry button

## 8. Accessibility

### 8.1. WCAG AA Compliance

- **Color Contrast**: 4.5:1 minimum for text
- **Focus Indicators**: Visible focus ring on button
- **Keyboard Navigation**: Tab to button, Enter to activate
- **Screen Reader**: Proper ARIA labels

### 8.2. ARIA Labels

```tsx
<button
  aria-label="Sign in with Google account"
  aria-describedby="signin-description"
>
  <GoogleIcon aria-hidden="true" />
  Sign in with Google
</button>
<p id="signin-description" className="sr-only">
  Opens Google authentication in a new window
</p>
```

## 9. Performance Optimization

### 9.1. Loading Strategy

- **Lazy Load**: OAuth SDK only when needed
- **Preload**: Google OAuth assets
- **Cache**: Auth state in memory

### 9.2. Bundle Size

- **Code Splitting**: Separate auth bundle
- **Tree Shaking**: Remove unused auth code
- **Minimal Dependencies**: Only Supabase Auth client

## 10. Implementation Checklist

### Phase 1: Basic Structure

- [ ] Create login page route (`/auth/login`)
- [ ] Create login component
- [ ] Add branding/logo
- [ ] Style with Tailwind (mobile-first)

### Phase 2: OAuth Integration

- [ ] Integrate Supabase Auth
- [ ] Configure Google OAuth provider
- [ ] Implement sign-in button
- [ ] Handle OAuth redirect

### Phase 3: Callback Handler

- [ ] Create callback route (`/auth/callback`)
- [ ] Exchange code for session
- [ ] Check user onboarding status
- [ ] Redirect appropriately

### Phase 4: State Management

- [ ] Create AuthContext
- [ ] Implement useAuth hook
- [ ] Add auth state persistence
- [ ] Handle token refresh

### Phase 5: Error Handling

- [ ] Add error states
- [ ] Display error messages
- [ ] Implement retry logic
- [ ] Add error logging

### Phase 6: Mobile Optimization

- [ ] Optimize button size
- [ ] Add loading states
- [ ] Implement haptic feedback
- [ ] Test on real devices

### Phase 7: Accessibility

- [ ] Add ARIA labels
- [ ] Test keyboard navigation
- [ ] Test screen readers
- [ ] Verify color contrast

### Phase 8: Polish

- [ ] Add animations
- [ ] Improve error messages
- [ ] Add legal links
- [ ] Final testing

## 11. File Structure

```
src/
├── pages/
│   ├── auth/
│   │   ├── login.astro          # Login page
│   │   └── callback.ts          # OAuth callback handler
│   └── index.astro              # Landing page (redirects to login)
├── components/
│   └── auth/
│       ├── LoginView.tsx        # Main login component
│       ├── GoogleSignInButton.tsx
│       ├── Branding.tsx
│       └── LegalLinks.tsx
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useAuth.ts
└── lib/
    └── auth/
        └── supabaseAuth.ts
```

## 12. Testing Strategy

### 12.1. Unit Tests

- Button click triggers OAuth
- Error states display correctly
- Loading states work

### 12.2. Integration Tests

- OAuth flow completes
- Callback handler works
- Redirects are correct

### 12.3. E2E Tests (Playwright)

- Complete login flow
- Error scenarios
- Mobile device testing

## 13. Dependencies

```json
{
  "@supabase/supabase-js": "^2.78.0",
  "react": "^19.1.1",
  "lucide-react": "^0.487.0"
}
```

## 14. Environment Variables

```env
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 15. Success Criteria

- [ ] User can sign in with Google
- [ ] OAuth flow completes successfully
- [ ] First-time users redirected to onboarding
- [ ] Returning users redirected to calendar
- [ ] Errors are handled gracefully
- [ ] Mobile experience is smooth
- [ ] Accessibility requirements met
- [ ] Performance targets achieved (< 1.5s load)
