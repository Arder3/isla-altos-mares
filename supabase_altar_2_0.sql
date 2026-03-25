-- =============================================
-- Altar 2.0 - Orchestrated Group Chat Migration
-- =============================================

-- 1. Daily Chat Sessions
CREATE TABLE IF NOT EXISTS public.altar_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enhanced Messages for Group Chat
-- We extend the existing altar_conversations or create a more robust one.
-- To avoid breaking current tests/dev, let's create a new v2 table.
CREATE TABLE IF NOT EXISTS public.altar_messages_v2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.altar_chat_sessions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id), -- User who sent it
  sender_role TEXT, -- 'host', 'kids', 'guest', 'agent'
  agent_persona TEXT, -- Name of the Hada/Duende if sender_role is 'agent'
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'link', 'action')),
  metadata JSONB DEFAULT '{ "mentions": [], "reply_to": null }',
  is_blessed BOOLEAN DEFAULT FALSE, -- Authorized by Father
  sub_chat_id UUID, -- If this belongs to a sub-chat
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Sub-chats (Specialized workspaces)
CREATE TABLE IF NOT EXISTS public.altar_sub_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  parent_session_id UUID REFERENCES public.altar_chat_sessions(id) ON DELETE CASCADE,
  alma_user_id UUID REFERENCES auth.users(id),
  agent_id TEXT NOT NULL, -- e.g. 'duente_arte', 'hada_narrativa'
  skill_name TEXT NOT NULL,
  task_goal TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  project_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 4. Agent Permissions (Father's Orders)
CREATE TABLE IF NOT EXISTS public.altar_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES public.altar_chat_sessions(id) ON DELETE CASCADE,
  granted_to_user_id UUID REFERENCES auth.users(id),
  skill_authorized TEXT NOT NULL, -- e.g. 'character_creation', 'illustration'
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Policies
ALTER TABLE public.altar_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.altar_messages_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.altar_sub_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.altar_permissions ENABLE ROW LEVEL SECURITY;

-- Everyone can view active sessions/messages (Group Chat)
CREATE POLICY "View active altar data" ON public.altar_chat_sessions FOR SELECT USING (true);
CREATE POLICY "View altar messages" ON public.altar_messages_v2 FOR SELECT USING (true);

-- Host can do anything
CREATE POLICY "Host manage everything" ON public.altar_chat_sessions FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

CREATE POLICY "Host manage messages" ON public.altar_messages_v2 FOR ALL 
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

-- Kids can insert messages if authenticated
CREATE POLICY "Auth users insert messages" ON public.altar_messages_v2 FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Sub-chats visibility
CREATE POLICY "View relevant sub-chats" ON public.altar_sub_chats FOR SELECT 
  USING (auth.uid() = alma_user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

-- Permissions visibility
CREATE POLICY "View relevant permissions" ON public.altar_permissions FOR SELECT 
  USING (auth.uid() = granted_to_user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));
