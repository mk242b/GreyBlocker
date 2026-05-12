import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://usafuglhcnmbovclugzv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_lad-QqAkeYbehiLCnnr6KQ_tXumB7_P';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
