
-- ==========================================
-- 1. ADDITIVE UPDATE (No Reset)
-- This script refreshes logic but preserves data.
-- ==========================================

-- Trigger to increment stats when a post is created
CREATE OR REPLACE FUNCTION public.handle_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET post_count = post_count + 1 WHERE id = NEW.author_id;
  UPDATE public.threads SET reply_count = reply_count + 1 WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to decrement stats when a post is deleted
CREATE OR REPLACE FUNCTION public.handle_post_deletion()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.author_id;
  UPDATE public.threads SET reply_count = GREATEST(0, reply_count - 1) WHERE id = OLD.thread_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to cleanup when a thread is deleted
CREATE OR REPLACE FUNCTION public.handle_thread_deletion()
RETURNS TRIGGER AS $$
BEGIN
  -- Data tables are linked with ON DELETE CASCADE.
  -- Stats for users are handled by the individual post_deletion triggers.
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View increment RPC
CREATE OR REPLACE FUNCTION public.increment_thread_view(t_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.threads SET view_count = view_count + 1 WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 2. REBIND TRIGGERS
-- ==========================================

DROP TRIGGER IF EXISTS on_post_created ON public.posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_stats();

DROP TRIGGER IF EXISTS on_post_deleted ON public.posts;
CREATE TRIGGER on_post_deleted
  AFTER DELETE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_deletion();

DROP TRIGGER IF EXISTS on_thread_deleted ON public.threads;
CREATE TRIGGER on_thread_deleted
  AFTER DELETE ON public.threads
  FOR EACH ROW EXECUTE PROCEDURE public.handle_thread_deletion();

-- ==========================================
-- 3. POLICIES (Update permissions)
-- ==========================================

-- Ensure staff helper exists
CREATE OR REPLACE FUNCTION is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = user_id AND (role = 'Admin' OR role = 'Moderator')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- THREADS - Allow Delete for Authors and Staff
DROP POLICY IF EXISTS "Threads delete (author/staff)" ON threads;
CREATE POLICY "Threads delete (author/staff)" ON threads FOR DELETE USING (
  auth.uid() = author_id OR is_staff(auth.uid())
);

-- POSTS - Allow Delete for Authors and Staff
DROP POLICY IF EXISTS "Posts delete (author/staff)" ON posts;
CREATE POLICY "Posts delete (author/staff)" ON posts FOR DELETE USING (
  auth.uid() = author_id OR is_staff(auth.uid())
);

-- Ensure Banned Users can't create content at DB level
DROP POLICY IF EXISTS "Threads insert authenticated" ON threads;
CREATE POLICY "Threads insert authenticated" ON threads FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (SELECT status FROM profiles WHERE id = auth.uid()) != 'Banned'
);

DROP POLICY IF EXISTS "Posts insert authenticated" ON posts;
CREATE POLICY "Posts insert authenticated" ON posts FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND (SELECT status FROM profiles WHERE id = auth.uid()) != 'Banned'
);
