-- ========================================================
-- ROJOSGAMES FORUM - FINAL STABLE SCHEMA
-- ========================================================

-- 1. BASE TABLES
-- --------------------------------------------------------

-- Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    role TEXT DEFAULT 'User' CHECK (role IN ('User', 'Moderator', 'Admin')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Warned', 'Banned')),
    post_count INTEGER DEFAULT 0,
    about TEXT,
    theme_preference TEXT DEFAULT 'dark',
    ban_reason TEXT,
    ban_expires TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Threads
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category_id TEXT DEFAULT 'general',
    view_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    liked_by UUID[] DEFAULT '{}',
    is_locked BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE
);

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    liked_by UUID[] DEFAULT '{}'
);

-- 2. FUNCTIONS (With Clean Drops to prevent name mismatch errors)
-- --------------------------------------------------------
DROP FUNCTION IF EXISTS public.is_staff(UUID) CASCADE;
CREATE OR REPLACE FUNCTION public.is_staff(u_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = u_id AND (role = 'Admin' OR role = 'Moderator'));
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    NEW.email,
    'https://cdn.discordapp.com/attachments/857780833967276052/1462032678584057866/defaultpfp.png?ex=696d6049&is=696c0ec9&hm=baf622e1557472b08edf9a0ea5afdb7c6bde3d5c855131823ac59478388b1e12&'
  ) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGERS
-- --------------------------------------------------------
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_thread_updated ON public.threads;
CREATE TRIGGER on_thread_updated BEFORE UPDATE ON public.threads FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_post_updated ON public.posts;
CREATE TRIGGER on_post_updated BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. POLICIES (Full Reset for Idempotency)
-- --------------------------------------------------------
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
    END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Threads select" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Threads insert" ON public.threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Threads update" ON public.threads FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Threads delete" ON public.threads FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));

CREATE POLICY "Posts select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Posts insert" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Posts update" ON public.posts FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Posts delete" ON public.posts FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));
