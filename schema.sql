-- ========================================================
-- ROJOSGAMES FORUM - PROFESSIONAL DATABASE SCHEMA
-- ========================================================

-- 1. BASE TABLES
-- --------------------------------------------------------

-- Profiles Table (Extended User Data)
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

-- Ensure banner_url exists (for legacy migrations)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='banner_url') THEN
        ALTER TABLE public.profiles ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- Threads Table
CREATE TABLE IF NOT EXISTS public.threads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
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

-- Posts Table (Replies)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    thread_id UUID REFERENCES public.threads(id) ON DELETE CASCADE NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    liked_by UUID[] DEFAULT '{}'
);

-- Reports Table (Moderation Queue)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('POST', 'THREAD', 'USER')),
    target_id UUID NOT NULL,
    reported_by TEXT NOT NULL, 
    author_username TEXT,
    target_url TEXT,
    reason TEXT NOT NULL,
    content_snippet TEXT,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESOLVED', 'DISMISSED'))
);

-- Messages Table (Private Chat)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL
);

-- 2. INDEXING (Performance Optimization)
-- --------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_threads_author ON public.threads(author_id);
CREATE INDEX IF NOT EXISTS idx_threads_created ON public.threads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_thread ON public.posts(thread_id);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(sender_id, receiver_id);

-- 3. FUNCTIONS & TRIGGERS
-- --------------------------------------------------------

-- Automatic updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Staff check helper
CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = user_id AND (role = 'Admin' OR role = 'Moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- View incrementer
CREATE OR REPLACE FUNCTION public.increment_thread_view(t_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.threads SET view_count = view_count + 1 WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Post statistics management
CREATE OR REPLACE FUNCTION public.handle_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
    UPDATE public.threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.author_id;
    UPDATE public.threads SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.thread_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- User auto-creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'Member_' || substr(NEW.id::text, 1, 5)),
    NEW.email,
    'https://cdn.discordapp.com/attachments/857780833967276052/1462032678584057866/defaultpfp.png'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Triggers
DROP TRIGGER IF EXISTS on_post_created ON public.posts;
CREATE TRIGGER on_post_created AFTER INSERT ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_post_stats();

DROP TRIGGER IF EXISTS on_post_deleted ON public.posts;
CREATE TRIGGER on_post_deleted AFTER DELETE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_post_stats();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. SECURITY (RLS POLICIES)
-- --------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles visibility" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Threads visibility" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Threads creation" ON public.threads FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (SELECT status FROM public.profiles WHERE id = auth.uid()) != 'Banned'
);
CREATE POLICY "Threads modification" ON public.threads FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Threads removal" ON public.threads FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));

CREATE POLICY "Posts visibility" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Posts creation" ON public.posts FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (SELECT status FROM public.profiles WHERE id = auth.uid()) != 'Banned'
);
CREATE POLICY "Posts modification" ON public.posts FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Posts removal" ON public.posts FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));

CREATE POLICY "Reports creation" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Reports staff view" ON public.reports FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Reports staff resolution" ON public.reports FOR UPDATE USING (is_staff(auth.uid()));

CREATE POLICY "Messages visibility" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Messages sending" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
