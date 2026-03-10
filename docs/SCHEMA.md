# Database Schema Reference

> This file is loaded on-demand. Referenced from CLAUDE.md.
> Updated by the setup wizard and as tables are added/modified.

## Core Tables

```
inboxes          - Connected messaging accounts (Gmail, Slack, iMessage, etc.)
messages         - Messages captured from inboxes (AI-processed)
tasks            - Tasks extracted from messages, synced to Notion
integrations     - External service configs (Notion workspace, API tokens, etc.)
notion_syncs     - Notion sync operation history
page_display_config - UI tab visibility config (admin-managed)
```

### inboxes

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| name | TEXT | Display name |
| type | TEXT | gmail, slack, imessage, whatsapp, notion, other |
| account_identifier | TEXT | Email address, Slack workspace ID, etc. |
| is_connected | BOOLEAN | Whether connection is active |
| last_synced_at | TIMESTAMPTZ | |
| config | JSONB | Non-secret connection config |
| is_archived | BOOLEAN | Soft delete |
| created_at / updated_at | TIMESTAMPTZ | |

RLS: Users can only access their own rows.

### messages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| inbox_id | UUID | FK → inboxes |
| user_id | UUID | FK → auth.users |
| external_id | TEXT | Original ID from source system |
| sender | TEXT | |
| subject | TEXT | |
| body | TEXT | Full message body |
| received_at | TIMESTAMPTZ | |
| is_read | BOOLEAN | |
| is_processed | BOOLEAN | AI has analyzed it |
| ai_summary | TEXT | AI-generated summary |
| source_url | TEXT | Link to original message |
| raw_data | JSONB | Original payload from source |
| is_archived | BOOLEAN | Soft delete |

RLS: Users can only access their own rows.

### tasks

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| message_id | UUID | FK → messages (nullable) |
| title | TEXT | |
| description | TEXT | |
| status | TEXT | pending, in_progress, done, cancelled |
| priority | TEXT | low, medium, high, urgent |
| due_date | DATE | |
| notion_page_id | TEXT | Synced Notion page ID |
| notion_synced_at | TIMESTAMPTZ | |
| tags | TEXT[] | |
| is_archived | BOOLEAN | Soft delete |

RLS: Users can only access their own rows.

### integrations

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| service | TEXT | notion, gmail, slack, gemini, signwell, resend, other |
| name | TEXT | Display name |
| is_enabled | BOOLEAN | |
| config | JSONB | Non-secret config (workspace IDs, etc.) |
| last_used_at | TIMESTAMPTZ | |
| is_archived | BOOLEAN | Soft delete |

Unique constraint: `(user_id, service)`

RLS: Users can only access their own rows.

### notion_syncs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK |
| user_id | UUID | FK → auth.users |
| task_id | UUID | FK → tasks (nullable on delete) |
| operation | TEXT | create, update, delete |
| status | TEXT | pending, success, failed |
| notion_page_id | TEXT | |
| notion_database_id | TEXT | |
| error_message | TEXT | |
| created_at | TIMESTAMPTZ | |

RLS: Users can only access their own rows.

## Service Config Tables

```
signwell_config  - E-signature config (single row, id=1) — RLS: authenticated read
page_display_config - UI tab visibility (single row per section+tab) — RLS: authenticated read/write
```

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| documents | No | E-signature documents, files |
| attachments | No | Message attachments |

## Common Patterns

- All tables use UUID primary keys
- All tables have `created_at` (and most have `updated_at`) timestamps
- RLS is enabled on all tables
- `is_archived` flag for soft deletes — filter client-side: `.filter(s => !s.is_archived)`
- `user_id` column with FK → auth.users enforces row-level ownership
