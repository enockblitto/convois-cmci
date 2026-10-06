import { createClient } from '@supabase/supabase-js'
import { IS_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from './config'

export const supabase = IS_DEMO ? null : createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
