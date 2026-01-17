
-- ==========================================
-- 1. CLEANUP (Reset the Database)
-- ==========================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_post_created ON public.posts;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_post_stats();
DROP FUNCTION IF EXISTS public.increment_thread_view(uuid);

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS assets CASCADE;

-- ==========================================
-- 2. CREATE TABLES
-- ==========================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'User', 
  status TEXT DEFAULT 'Active',
  join_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  post_count INTEGER DEFAULT 0,
  about TEXT,
  theme_preference TEXT DEFAULT 'dark',
  ban_reason TEXT,
  ban_expires TEXT
);

CREATE TABLE threads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id TEXT DEFAULT 'cat2', 
  author_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reply_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}',
  is_locked BOOLEAN DEFAULT FALSE,
  is_pinned BOOLEAN DEFAULT FALSE
);

CREATE TABLE posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID REFERENCES threads(id) ON DELETE CASCADE,
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  likes INTEGER DEFAULT 0,
  liked_by UUID[] DEFAULT '{}'
);

CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);

CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL, -- 'POST', 'THREAD', 'USER'
  target_id TEXT NOT NULL UNIQUE, -- Only reportable once
  reported_by TEXT NOT NULL, -- Reporter Username
  author_username TEXT, -- Reported Person Username
  target_url TEXT, -- Link to content
  reason TEXT NOT NULL,
  content_snippet TEXT,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- 3. THE SMART AUTOMATION
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  custom_username TEXT := new.raw_user_meta_data->>'username';
BEGIN
  IF custom_username IS NULL OR custom_username = '' THEN
    custom_username := split_part(new.email, '@', 1);
  END IF;

  INSERT INTO public.profiles (id, email, role, username, display_name, avatar_url)
  VALUES (
    new.id, 
    new.email, 
    CASE WHEN new.email = 'admin@rojos.games' THEN 'Admin' ELSE 'User' END, 
    custom_username,
    custom_username,
    'https://api.dicebear.com/7.x/avataaars/svg?seed=' || custom_username
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  UPDATE public.threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.increment_thread_view(t_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.threads SET view_count = view_count + 1 WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. BIND TRIGGERS
-- ==========================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_stats();

-- ==========================================
-- 5. ENABLE SECURITY (RLS)
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users update own" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins update all" ON profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Moderator'))
);
CREATE POLICY "Threads viewable" ON threads FOR SELECT USING (true);
CREATE POLICY "Threads insert" ON threads FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Threads update (likes)" ON threads FOR UPDATE USING (true);
CREATE POLICY "Posts viewable" ON posts FOR SELECT USING (true);
CREATE POLICY "Posts insert" ON posts FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Posts update (likes)" ON posts FOR UPDATE USING (true);
CREATE POLICY "Messages private" ON messages FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Messages send" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Reports admin" ON reports FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'Admin' OR role = 'Moderator')));
CREATE POLICY "Reports create" ON reports FOR INSERT WITH CHECK (auth.role() = 'authenticated');
