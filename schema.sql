-- ========================================================
-- ROJOSGAMES FORUM - SECURITY & IP TRACKING SCHEMA
-- ========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. TABLES
-- --------------------------------------------------------

-- Profiles Table (Core User Data)
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
    last_ip TEXT, -- Tracking column
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Blacklisted IPs
CREATE TABLE IF NOT EXISTS public.ip_bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT,
    banned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Detailed Access Logs
CREATE TABLE IF NOT EXISTS public.user_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip TEXT NOT NULL,
    user_agent TEXT,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure columns exist if tables were previously created
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_ip') THEN
        ALTER TABLE public.profiles ADD COLUMN last_ip TEXT;
    END IF;
END $$;

-- Forum Content Tables
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

CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    type TEXT NOT NULL,
    target_id UUID NOT NULL,
    reported_by TEXT NOT NULL, 
    author_username TEXT,
    target_url TEXT,
    reason TEXT NOT NULL,
    content_snippet TEXT,
    status TEXT DEFAULT 'PENDING'
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL
);

-- 2. SECURITY FUNCTIONS
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_staff(u_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = u_id AND (role = 'Admin' OR role = 'Moderator'));
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    NEW.email,
    'https://tr.rbxcdn.com/38c6ed3cba6211116fbc8263301037f4/420/420/Avatar/Png'
  ) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. RLS POLICIES
-- --------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ips ENABLE ROW LEVEL SECURITY;

-- Clean start for policies
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename); END LOOP;
END $$;

-- Profiles
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_staff(auth.uid()));

-- IP Bans (Public read so the app can check before login)
CREATE POLICY "Ip bans select" ON public.ip_bans FOR SELECT USING (true);
CREATE POLICY "Ip bans staff_modify" ON public.ip_bans FOR ALL