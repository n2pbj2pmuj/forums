
-- ========================================================
-- ROJOSGAMES FORUM - COMPLETE DATABASE SCHEMA
-- ========================================================

-- 1. TABLES DEFINITIONS
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
    reported_by TEXT NOT NULL, -- Username of reporter
    author_username TEXT, -- Username of the reported user
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

-- 2. FUNCTIONS & RPCs
-- --------------------------------------------------------

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

-- 3. AUTOMATED TRIGGERS
-- --------------------------------------------------------

-- Handle stats when post is created
CREATE OR REPLACE FUNCTION public.handle_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  UPDATE public.threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Handle stats when post is deleted
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.author_id;
  UPDATE public.threads SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.thread_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Profile automatically on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, email, avatar_url)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 5)),
    COALESCE(NEW.raw_user_meta_data->>'username', 'User_' || substr(NEW.id::text, 1, 5)),
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
CREATE TRIGGER on_post_deleted AFTER DELETE ON public.posts FOR EACH ROW EXECUTE PROCEDURE public.handle_post_deletion();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. SECURITY (RLS POLICIES)
-- --------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can read, user can update own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Threads: Everyone can read, authenticated can insert (if not banned)
CREATE POLICY "Threads are viewable by everyone" ON public.threads FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create threads" ON public.threads FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (SELECT status FROM public.profiles WHERE id = auth.uid()) != 'Banned'
);
CREATE POLICY "Authors and staff can update threads" ON public.threads FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Authors and staff can delete threads" ON public.threads FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));

-- Posts: Everyone can read, authenticated can insert (if not banned)
CREATE POLICY "Posts are viewable by everyone" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (SELECT status FROM public.profiles WHERE id = auth.uid()) != 'Banned'
);
CREATE POLICY "Authors and staff can update posts" ON public.posts FOR UPDATE USING (auth.uid() = author_id OR is_staff(auth.uid()));
CREATE POLICY "Authors and staff can delete posts" ON public.posts FOR DELETE USING (auth.uid() = author_id OR is_staff(auth.uid()));

-- Reports: Authenticated can create, Staff can read/update
CREATE POLICY "Authenticated can create reports" ON public.reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Staff can view reports" ON public.reports FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff can update reports" ON public.reports FOR UPDATE USING (is_staff(auth.uid()));

-- Messages: Users can only see messages they are part of
CREATE POLICY "Users can view own messages" ON public.messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
