# Common Patterns & Conventions

> This file is loaded on-demand. Referenced from CLAUDE.md.

## Tailwind CSS Design Tokens

Use design tokens defined in `styles/tailwind.css` `@theme` block. Run `npm run css:build` after adding new classes.

Tailwind v4 uses CSS-first config — no `tailwind.config.js`. Output: `styles/tailwind.out.css` (committed).

**Sarah's Assistant design tokens:**

```css
/* Brand */
bg-brand-primary       /* #6366f1 indigo — primary actions */
bg-brand-secondary     /* #8b5cf6 violet — secondary actions */
bg-brand-accent        /* #06b6d4 cyan — highlights */

/* Surface */
bg-surface-base        /* #ffffff */
bg-surface-muted       /* #f8fafc */
bg-surface-subtle      /* #f1f5f9 */
border-surface-border  /* #e2e8f0 */

/* Text */
text-text-primary      /* #0f172a */
text-text-secondary    /* #475569 */
text-text-muted        /* #94a3b8 */

/* Status */
text-status-success    /* #10b981 */
text-status-warning    /* #f59e0b */
text-status-error      /* #ef4444 */

/* Task/Inbox types */
bg-task-pending        /* #f59e0b */
bg-task-done           /* #10b981 */
bg-inbox-email         /* #6366f1 */
bg-inbox-slack         /* #e91e63 */
```

**Add Tailwind stylesheet to every HTML page:**
```html
<link rel="stylesheet" href="styles/tailwind.out.css">
```

## Auth System (`shared/auth.js`)

**Sign-in method:** Google OAuth (primary) + email/password (fallback)

- **Profile button**: Auto-inserts into `.site-nav__inner` (or first `<nav>`). Shows person icon when logged out, Google avatar when logged in.
- **Login modal**: "Continue with Google" button → `supabase.auth.signInWithOAuth({ provider: 'google' })`. Email/password also available.
- **Dropdown menu**: When logged in — "Dashboard" link + "Sign Out".
- **Page guard**: Admin pages call `requireAuth(callback)` — redirects to `../index.html` if not authenticated.
- **Supabase client**: Exposed as `window.adminSupabase` for data access.

**Script loading order on every page:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
<script src="shared/supabase.js"></script>
<script src="shared/auth.js"></script>
```

**OAuth callback flow:** Supabase redirects back to `window.location.origin + pathname` after Google auth. No special callback page needed for GitHub Pages.

## Admin Pages (`admin/`)

- All admin pages are in `admin/` directory with `<meta name="robots" content="noindex, nofollow">`
- Each page loads `shared/admin.css` and calls `requireAuth()`:
```javascript
requireAuth(function(user, supabase) {
    // Page is authenticated — load data using supabase client
});
```
- CRUD pattern: `admin-table` for listing, `admin-modal` for add/edit forms
- CSS classes are themeable via CSS custom properties

## Conventions

1. Use toast notifications, not `alert()`
2. Filter archived items client-side: `.filter(s => !s.is_archived)`
3. Don't expose personal info in public views
4. Client-side image compression for files > 500KB
5. `openLightbox(url)` for image viewing
