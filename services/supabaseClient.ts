
import { createClient } from 'https://esm.sh/@supabase/supabase-js@^2.48.1';

// Standard Vite environment variables access
const getEnv = (key: string): string | null => {
  // @ts-ignore - Accessing Vite's import.meta.env
  const env = (import.meta as any).env;
  if (env && env[key]) return env[key];
  
  // Fallback for non-Vite or CI/CD environments
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  return null;
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL') || 'https://jmwavowodaeagqbeefca.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY') || 'sb_publishable_IKByYfb9iijuEq8T2FTCMw_1BtFaamh';

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. Client might not initialize properly.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
