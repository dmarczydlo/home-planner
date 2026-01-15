# Styling Guide - Quick Reference

## 🎨 Theme Colors (Always Use These)

### Text Colors
- `text-foreground` - Main text (replaces `text-gray-900 dark:text-white`)
- `text-muted-foreground` - Secondary text (replaces `text-gray-600 dark:text-gray-400`)
- `text-primary` - Accent text
- `text-destructive` - Error text
- `text-warning` - Warning text
- `text-success` - Success text

### Background Colors
- `bg-background` - Page background
- `bg-card` - Card/container background (replaces `bg-white dark:bg-gray-800`)
- `bg-muted` - Muted background (replaces `bg-gray-100 dark:bg-gray-800`)
- `bg-primary/20` - Primary with 20% opacity
- `bg-destructive/10` - Destructive with 10% opacity

### Border Colors
- `border-primary/20` - Primary border (replaces `border-gray-200 dark:border-gray-700`)
- `border-border` - Default border
- `border-destructive/30` - Destructive border

## 🛠️ Utility Classes (Use These Instead of Custom Styles)

### Glass Effect
```tsx
<div className="glass-effect rounded-lg p-6">
  {/* Automatically applies: bg-background/40 backdrop-blur-2xl border border-primary/20 */}
</div>
```

### Modal/Dialog
```tsx
<div className="modal-container">
  <div className="modal-header">
    <h2 className="modal-title">Title</h2>
  </div>
  <div className="modal-content">
    {/* Content */}
  </div>
</div>
```

### Form Elements
```tsx
<label className="form-label">Label</label>
<input className="form-input" />
<select className="form-select">...</select>
<p className="form-description">Helper text</p>
```

### Cards
```tsx
<div className="card-modern">
  <div className="card-header-modern">
    <h3 className="card-title-modern">Title</h3>
    <p className="card-description-modern">Description</p>
  </div>
</div>
```

### Buttons
```tsx
<button className="btn-primary">Primary</button>
<button className="btn-secondary">Secondary</button>
<button className="btn-destructive">Delete</button>
```

### Alerts
```tsx
<div className="alert-error">
  <p className="alert-error-text">Error</p>
</div>
<div className="alert-warning">
  <p className="alert-warning-text">Warning</p>
</div>
<div className="alert-success">
  <p className="alert-success-text">Success</p>
</div>
```

## 🚫 Forbidden Patterns

**NEVER use these:**
- ❌ `text-gray-900`, `text-gray-600`, `text-gray-400` → ✅ `text-foreground`, `text-muted-foreground`
- ❌ `bg-white`, `bg-gray-50`, `bg-gray-800` → ✅ `bg-card`, `bg-background`, `glass-effect`
- ❌ `border-gray-200`, `border-gray-700` → ✅ `border-primary/20`, `border-border`
- ❌ `dark:text-white`, `dark:bg-gray-800` → ✅ Theme handles dark mode automatically
- ❌ Hardcoded colors like `#ffffff`, `rgb(255,255,255)` → ✅ Use theme CSS variables

## 📋 Quick Checklist

When creating/updating components:
- [ ] All text uses `text-foreground` or `text-muted-foreground`
- [ ] All backgrounds use `bg-card`, `bg-background`, or `glass-effect`
- [ ] All borders use `border-primary/20` or `border-border`
- [ ] No `dark:` color variants (theme handles it)
- [ ] Using utility classes where possible
- [ ] Modals use `.modal-container` or `.glass-effect`
- [ ] Forms use `.form-input`, `.form-label`, etc.

## 📚 Full Documentation

See `.cursor/rules/styling.mdc` for complete styling guidelines.
