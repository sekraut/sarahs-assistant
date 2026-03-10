# Key Files Reference

> This file is loaded on-demand. Referenced from CLAUDE.md.

## Shared Modules (`/shared/`)

- `supabase.js` — Supabase client singleton (anon key embedded)
- `auth.js` — Authentication module (Google OAuth, profile button, page guard)
- `admin.css` — Admin styles: layout, tables, modals, badges (themeable via CSS custom properties)
- `email-service.js` — Resend email client: `EmailService.send({ to, subject, html })`
- `signwell-service.js` — SignWell e-signature wrapper: `SignWellService.createDocument(...)`

## Edge Functions (`/supabase/functions/`)

- `send-email/` — Sends email via Resend API (JWT-protected)
- `signwell-webhook/` — Handles SignWell document events (no-verify-jwt, HMAC verification)
- `ai-process/` — Gemini AI: analyze_message, extract_tasks, summarize (JWT-protected)

## Configuration

- `shared/supabase.js` — Supabase URL + anon key (must export globals)
- `styles/tailwind.css` — Tailwind v4 CSS-first config with `@theme` tokens
- `styles/tailwind.out.css` — Built CSS output (committed; referenced by all HTML pages)
- `version.json` — Auto-bumped by CI on every push

## GitHub Actions

- `.github/workflows/bump-version-on-push.yml` — Runs on push to main; builds CSS + bumps version

## Admin Pages (`/admin/`)

- Each page: loads `shared/admin.css`, calls `requireAuth(callback)`
- Pattern: topbar nav links between sub-pages, table listing + modal forms

## Build & Scripts

- `npm run css:build` — Rebuild Tailwind output
- `npm run css:watch` — Watch mode for development
- `scripts/bump-version.sh` — CI version bump (never run locally)

<!-- Add more key files as the project grows -->
