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

-- =============================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- Crea tu usuario HOST en:
-- Supabase > Authentication > Users > "Add user"
-- Luego en tabla profiles, cambia su rol a 'host'
-- =============================================
