import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vggfgyeztihpjohuevoy.supabase.co'
const supabaseAnonKey = 'sb_publishable_tHtxEKwDw_ioyXysCLPwdg_QhB5RixM'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
