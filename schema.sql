
-- ==========================================
-- ADDITIVE UPDATE: Banner Support
-- ==========================================

-- Check if banner_url exists and add it if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='banner_url') THEN
        ALTER TABLE public.profiles ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- Refresh triggers (Safe execution)
DROP TRIGGER IF EXISTS on_post_created ON public.posts;
CREATE TRIGGER on_post_created
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_stats();

DROP TRIGGER IF EXISTS on_post_deleted ON public.posts;
CREATE TRIGGER on_post_deleted
  AFTER DELETE ON public.posts
  FOR EACH ROW EXECUTE PROCEDURE public.handle_post_deletion();
