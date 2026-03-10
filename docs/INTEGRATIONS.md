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

### Email (Resend) ⏳ pending setup
- API key stored as Supabase secret: `RESEND_API_KEY`
- Free tier: 3,000 emails/month
- Edge function: `send-email`

---

### E-Signatures (SignWell) ⏳ pending setup
- Config in `signwell_config` table
- Edge function: `signwell-webhook` (deploy with `--no-verify-jwt`)
- Webhook URL: `https://vtflffpvetugzvrrrotr.supabase.co/functions/v1/signwell-webhook`
- Free tier: 3–25 docs/month

---

### AI Features (Google Gemini) ⏳ pending setup
- API key stored as Supabase secret: `GEMINI_API_KEY`
- Free tier: 1,500 requests/day, 15 RPM (flash model)
- Edge function: `ai-process` (message analysis, task extraction)

---

### Google Sign-In (OAuth) ⏳ pending setup
- Auth provider: Google via Supabase Auth
- Redirect URI: `https://vtflffpvetugzvrrrotr.supabase.co/auth/v1/callback`
- Client module: `shared/auth.js`

---

<!-- Only the services selected during setup will be active -->
