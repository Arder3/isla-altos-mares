-- =============================================
-- Portal Unificado - Supabase Setup Script
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Tabla de perfiles (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  nombre_display TEXT,
  rol TEXT NOT NULL DEFAULT 'guest'
    CHECK (rol IN ('host', 'vip', 'confidente', 'equipo', 'guest', 'kids')),
  modulos JSONB DEFAULT '{}',
  proyectos_acceso JSONB DEFAULT '{}',
  estado TEXT NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo', 'pendiente', 'bloqueado', 'vencido')),
  fecha_caducidad TIMESTAMPTZ DEFAULT NULL,
  tipo_invitacion TEXT DEFAULT 'generica'
    CHECK (tipo_invitacion IN ('personalizada', 'improvisada', 'confianza', 'trabajo', 'generica', 'kids')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de seguridad
-- Eliminar si ya existen (para poder re-ejecutar el script)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- El usuario solo puede ver su propio perfil
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- El usuario puede actualizar su propio perfil
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- El HOST puede ver TODOS los perfiles (necesario para el Panel de Auditoría)
DROP POLICY IF EXISTS "Host reads all profiles" ON public.profiles;
CREATE POLICY "Host reads all profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.rol = 'host'));

-- 4. Trigger: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nombre_display, rol, estado)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nombre_display', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'rol', 'guest'),
    COALESCE(NEW.raw_user_meta_data->>'estado', 'pendiente')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Vista para que el HOST vea todos los perfiles (sin RLS restriction)
-- (Lo usará el panel de admin)
CREATE OR REPLACE VIEW public.all_profiles AS
  SELECT * FROM public.profiles;

-- 6. Tabla de Feedback Visual
CREATE TABLE IF NOT EXISTS public.portal_feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_role TEXT NOT NULL,
  target_type TEXT NOT NULL CHECK (target_type IN ('element', 'text', 'area')),
  target_data JSONB NOT NULL, -- {selector, range, coords, etc}
  content TEXT NOT NULL,
  path TEXT NOT NULL, -- e.g. /characters/mita
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS para Feedback
ALTER TABLE public.portal_feedback ENABLE ROW LEVEL SECURITY;

-- Los usuarios ven sus propios comentarios
CREATE POLICY "Users view own feedback" 
  ON public.portal_feedback FOR SELECT
  USING (auth.uid() = user_id);

-- El HOST ve todos los comentarios
CREATE POLICY "Host views all feedback" 
  ON public.portal_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND rol = 'host'
    )
  );

-- Usuarios pueden insertar sus propios comentarios
CREATE POLICY "Users insert own feedback"
  ON public.portal_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuarios pueden borrar sus propios comentarios
CREATE POLICY "Users delete own feedback"
  ON public.portal_feedback FOR DELETE
  USING (auth.uid() = user_id);

-- 8. Tabla de Borradores de Personajes (Hilos persistentes)
CREATE TABLE IF NOT EXISTS public.character_drafts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nombre_provisorio TEXT,
  status TEXT DEFAULT 'latente' CHECK (status IN ('latente', 'materializado', 'descartado')),
  current_metadata JSONB DEFAULT '{}', -- Datos del personaje en construcción
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Tabla de Conversaciones con la Voz del Altar
CREATE TABLE IF NOT EXISTS public.altar_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  draft_id UUID REFERENCES public.character_drafts(id) ON DELETE CASCADE NOT NULL,
  sender TEXT CHECK (sender IN ('alma', 'altar')),
  content TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Perfil de Ecos (Intercambio Emocional / Profiling)
CREATE TABLE IF NOT EXISTS public.alma_ecos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  pregunta TEXT NOT NULL,
  respuesta TEXT NOT NULL,
  categoria TEXT, -- miedos, deseos, sabores, etc.
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Log de Generaciones (Tope diario de 4)
CREATE TABLE IF NOT EXISTS public.generation_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action_type TEXT DEFAULT 'image_gen',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. RLS para el Altar
ALTER TABLE public.character_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.altar_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alma_ecos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: El usuario solo accede a sus propios datos; El HOST ve TODO
CREATE POLICY "Users access own drafts" ON public.character_drafts FOR ALL 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

CREATE POLICY "Users access own conversations" ON public.altar_conversations FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM public.character_drafts WHERE id = draft_id AND user_id = auth.uid())
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host')
  );

CREATE POLICY "Users access own ecos" ON public.alma_ecos FOR ALL 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

CREATE POLICY "Users access own gen logs" ON public.generation_logs FOR ALL 
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));

-- 13. Tabla de Notificaciones en Tiempo Real
-- Cuando Alma interactúa, el sistema inserta una fila aquí y el Host la recibe en vivo.
CREATE TABLE IF NOT EXISTS public.portal_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL, -- quien recibe (el host)
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,             -- quien genera el evento (alma)
  sender_display_name TEXT,
  event_type TEXT NOT NULL, -- 'altar_vision', 'altar_eco', 'portal_login', etc.
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

-- El destinatario puede ver y actualizar sus propias notificaciones
DROP POLICY IF EXISTS "Recipient views own notifications" ON public.portal_notifications;
CREATE POLICY "Recipient views own notifications" ON public.portal_notifications FOR SELECT
  USING (auth.uid() = recipient_user_id);

DROP POLICY IF EXISTS "Recipient update own notifications" ON public.portal_notifications;
CREATE POLICY "Recipient update own notifications" ON public.portal_notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id);

-- Cualquier usuario autenticado puede insertar (para enviar notificación al host)
DROP POLICY IF EXISTS "Users can insert notifications" ON public.portal_notifications;
CREATE POLICY "Users can insert notifications" ON public.portal_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- El host puede ver todas las notificaciones (auditoría global)
DROP POLICY IF EXISTS "Host views all notifications" ON public.portal_notifications;
CREATE POLICY "Host views all notifications" ON public.portal_notifications FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND rol = 'host'));
