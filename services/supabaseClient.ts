
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

// Standard Vite environment variables
// Fix: Use type casting to any to access the env property on import.meta for compatibility
const VITE_URL = (import.meta as any).env?.VITE_SUPABASE_URL;
const VITE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Fallback to process.env (for some CI/CD environments) or hardcoded defaults
const supabaseUrl = VITE_URL || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_URL : null) || 'https://jmwavowodaeagqbeefca.supabase.co';
const supabaseKey = VITE_KEY || (typeof process !== 'undefined' ? process.env?.VITE_SUPABASE_ANON_KEY : null) || 'sb_publishable_IKByYfb9iijuEq8T2FTCMw_1BtFaamh';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Client might not initialize properly.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
