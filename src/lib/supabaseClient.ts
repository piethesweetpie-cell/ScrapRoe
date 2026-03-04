import { createClient } from '@supabase/supabase-js';

// 1. Project Settings > API에서 확인
const supabaseUrl = 'https://tkfkpcfqofivhnxvqrqm.supabase.co'; // Project URL

// 2. anon public 키만 복사해서 넣으세요 (service_role X)
const supabaseAnonKey = 'sb_publishable_NEgOaSL2mMJSkAZTLDpx7g_kjV6tLWM'; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);