
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jmwavowodaeagqbeefca.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_IKByYfb9iijuEq8T2FTCMw_1BtFaamh';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Check environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
