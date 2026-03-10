# External Services & Integrations

> This file is loaded on-demand. Referenced from CLAUDE.md.
> Each section is added by the setup wizard when a service is configured.

## API Cost Accounting (REQUIRED)

**Every feature that makes external API calls MUST log usage for cost tracking.**

When building or modifying any feature that calls a paid API, instrument it to log each API call with its cost data.

## Configured Services

---

### Supabase ✅
- Project: https://supabase.com/dashboard/project/vtflffpvetugzvrrrotr
- Project URL: https://vtflffpvetugzvrrrotr.supabase.co
- Region: us-east-1
- Storage buckets: `documents` (private), `attachments` (private)
- Webhook base URL: `https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/`

---

### Email (Resend) ✅
- API key stored as Supabase secret: `RESEND_API_KEY`
- Free tier: 3,000 emails/month
- Edge function: `send-email` → https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/send-email
- Client: `shared/email-service.js` → `EmailService.send({ to, subject, html })`
- Default from: `Sarah's Assistant <noreply@resend.dev>`

---

### E-Signatures (SignWell) ✅
- API key stored as Supabase secret: `SIGNWELL_API_KEY`
- Webhook secret stored as: `SIGNWELL_WEBHOOK_SECRET` _(configure when webhook is added)_
- Config in `signwell_config` table
- Edge function: `signwell-webhook` (deployed with `--no-verify-jwt`)
- Webhook URL: `https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/signwell-webhook`
- Client: `shared/signwell-service.js` → `SignWellService.createDocument(...)`
- Free tier: 3–25 docs/month
- **TODO:** Add webhook URL at https://www.signwell.com/app/settings/webhooks then run:
  `supabase secrets set SIGNWELL_WEBHOOK_SECRET=<your-secret>`

---

### AI Features (Google Gemini) ✅
- API key stored as Supabase secret: `GEMINI_API_KEY`
- Model: `gemini-2.0-flash` (free: 1,500 req/day, 15 RPM)
- Edge function: `ai-process` → https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/ai-process
- Supported types: `analyze_message`, `extract_tasks`, `summarize`
- POST `{ type, content, context? }` → returns `{ ok, data }`

---

### Google Sign-In (OAuth) ✅
- Auth provider: Google via Supabase Auth
- Redirect URI: `https://vtflffpvetugzvrrrotr.supabase.co/auth/v1/callback`
- Client module: `shared/auth.js` — Google OAuth primary, email/password fallback

---

<!-- Only the services selected during setup will be active -->
