
-- ========================================================
-- ROJOSGAMES FORUM - INTEGRATED PRODUCTION SCHEMA
-- Includes: Advanced Moderation, Messaging, Friend System, and Presence
-- ========================================================

-- 1. SETUP & EXTENSIONS
-- --------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean up existing relationship tables to ensure the new schema takes precedence
DROP TABLE IF EXISTS public.friends CASCADE;
DROP TABLE IF EXISTS public.friend_requests CASCADE;
DROP TABLE IF EXISTS public.blocks CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;

-- 2. BASE TABLES (PROFILES & MODERATION)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    role TEXT DEFAULT 'User' CHECK (role IN ('User', 'Moderator', 'Admin')),
    status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Warned', 'Banned')),
    presence_status TEXT DEFAULT 'Online' CHECK (presence_status IN ('Online', 'Idle', 'DND')), -- NEW FEATURE
    post_count INTEGER DEFAULT 0,
    about TEXT,
    theme_preference TEXT DEFAULT 'dark',
    ban_reason TEXT,
    ban_expires TEXT,
    last_ip TEXT, 
    email TEXT,
    is_protected BOOLEAN DEFAULT FALSE,
    notes TEXT DEFAULT '',
    mod_notes JSONB DEFAULT '[]'::jsonb,
    punishments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Ensure moderation and presence columns exist (idempotency check)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='mod_notes') THEN
        ALTER TABLE public.profiles ADD COLUMN mod_notes JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='punishments') THEN
        ALTER TABLE public.profiles ADD COLUMN punishments JSONB DEFAULT '[]'::jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_protected') THEN
        ALTER TABLE public.profiles ADD COLUMN is_protected BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='presence_status') THEN
        ALTER TABLE public.profiles ADD COLUMN presence_status TEXT DEFAULT 'Online' CHECK (presence_status IN ('Online', 'Idle', 'DND'));
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ip_bans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address TEXT UNIQUE NOT NULL,
    reason TEXT,
    banned_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_ips (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip TEXT NOT NULL,
    user_agent TEXT,
    path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. CONTENT TABLES (THREADS, POSTS, REPORTS)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- CASCADE DELETE ENABLED
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
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL, -- CASCADE DELETE ENABLED
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL, -- CASCADE DELETE ENABLED
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

-- 4. SOCIAL & MESSAGING TABLES (INTEGRATED FEATURES)
-- --------------------------------------------------------

-- Friends table (Mutual)
CREATE TABLE public.friends (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    friend_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, friend_id)
);

-- Friend Requests table
CREATE TABLE public.friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(sender_id, receiver_id)
);

-- Blocks table
CREATE TABLE public.blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(blocker_id, blocked_id)
);

-- Messages table (Advanced version with reactions/attachments)
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    attachments JSONB DEFAULT '[]'::jsonb,
    reactions JSONB DEFAULT '{}'::jsonb -- NEW FEATURE: Stores emoji: [user_ids]
);

-- 5. FUNCTIONS & TRIGGERS
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_staff(u_id UUID) RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = u_id AND (role = 'Admin' OR role = 'Moderator'));
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_thread_view(t_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.threads SET view_count = view_count + 1 WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ADMIN PRIVACY: Clear IP history when a user is promoted to Admin
CREATE OR REPLACE FUNCTION public.handle_admin_privacy() 
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'Admin' THEN
        DELETE FROM public.user_ips WHERE user_id = NEW.id;
        NEW.last_ip := NULL;
    END IF;
    RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = NOW(); 
  RETURN NEW; 
END; $$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url, presence_status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    NEW.email,
    'https://cdn.discordapp.com/attachments/857780833967276052/1462032678584057866/defaultpfp.png',
    'Online'
  ) ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach Triggers
DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

DROP TRIGGER IF EXISTS on_admin_privacy_check ON public.profiles;
CREATE TRIGGER on_admin_privacy_check BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_admin_privacy();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- --------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ip_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;

-- Cleanup existing policies to prevent conflicts
DO $$
DECLARE pol RECORD;
BEGIN
    FOR pol IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public')
    LOOP EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename); END LOOP;
END $$;

-- 6.1 Profile Policies
CREATE POLICY "Profiles select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update" ON public.profiles FOR UPDATE USING (auth.uid() = id OR is_staff(auth.uid()));

-- 6.2 IP & Moderation Policies
CREATE POLICY "Ip bans select" ON public.ip_bans FOR SELECT USING (true);
CREATE POLICY "Ip bans modify" ON public.ip_bans FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "User_ips insert" ON public.user_ips FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User_ips view" ON public.user_ips FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

-- 6.3 Forum Content Policies
CREATE POLICY "Threads select" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Threads mod" ON public.threads FOR ALL USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Threads insert" ON public.threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Posts select" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Posts mod" ON public.posts FOR ALL USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Posts insert" ON public.posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 6.4 Report Policies
CREATE POLICY "Reports insert" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Reports select" ON public.reports FOR SELECT USING (is_staff(auth.uid()));

-- 6.5 Friend System Policies
CREATE POLICY "Friends view" ON public.friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
CREATE POLICY "Friends delete" ON public.friends FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Requests view" ON public.friend_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Requests insert" ON public.friend_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Requests update" ON public.friend_requests FOR UPDATE USING (auth.uid() = receiver_id);
CREATE POLICY "Requests delete" ON public.friend_requests FOR DELETE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Blocks view" ON public.blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Blocks insert" ON public.blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Blocks delete" ON public.blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 6.6 Messaging Policies
CREATE POLICY "Messages access" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Messages insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Messages update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Messages delete" ON public.messages FOR DELETE USING (auth.uid() = sender_id);
