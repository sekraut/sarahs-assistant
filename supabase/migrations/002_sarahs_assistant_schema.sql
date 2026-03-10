-- Sarah's Assistant Core Schema
-- AI inbox monitor + task organizer + Notion sync

-- ============================================================
-- INBOXES
-- Connected messaging accounts (Gmail, Slack, iMessage, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS inboxes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('gmail', 'slack', 'imessage', 'whatsapp', 'notion', 'other')),
  account_identifier TEXT, -- email address, Slack workspace ID, etc.
  is_connected BOOLEAN NOT NULL DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  config JSONB DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE inboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own inboxes"
  ON inboxes FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- MESSAGES
-- Captured messages from connected inboxes
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inbox_id UUID REFERENCES inboxes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id TEXT, -- original message ID from source system
  sender TEXT,
  subject TEXT,
  body TEXT,
  received_at TIMESTAMPTZ,
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_processed BOOLEAN NOT NULL DEFAULT false, -- AI has analyzed it
  ai_summary TEXT,
  source_url TEXT,
  raw_data JSONB DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(inbox_id, external_id)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own messages"
  ON messages FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TASKS
-- Tasks extracted (by AI or manually) from messages
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'done', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date DATE,
  notion_page_id TEXT, -- synced Notion page ID
  notion_synced_at TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- INTEGRATIONS
-- External service configs (Notion workspace, API tokens, etc.)
-- ============================================================
CREATE TABLE IF NOT EXISTS integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  service TEXT NOT NULL CHECK (service IN ('notion', 'gmail', 'slack', 'gemini', 'signwell', 'resend', 'other')),
  name TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  config JSONB DEFAULT '{}', -- non-secret config (workspace IDs, database IDs, etc.)
  last_used_at TIMESTAMPTZ,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, service)
);

ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own integrations"
  ON integrations FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- NOTION_SYNCS
-- History of Notion sync operations for tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS notion_syncs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  operation TEXT NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  notion_page_id TEXT,
  notion_database_id TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE notion_syncs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own sync history"
  ON notion_syncs FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SERVICE CONFIG TABLES (single-row, admin-managed)
-- ============================================================

-- SignWell config (e-signatures)
CREATE TABLE IF NOT EXISTS signwell_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  api_key_hint TEXT,
  webhook_url TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE signwell_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read signwell config"
  ON signwell_config FOR SELECT TO authenticated USING (true);

-- ============================================================
-- AUTO-UPDATE updated_at TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inboxes_updated_at
  BEFORE UPDATE ON inboxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
