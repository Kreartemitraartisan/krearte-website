import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Admin client untuk server-side (public data read only)
export const createAdminClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables.\n' +
      'Please add to .env.local:\n' +
      'NEXT_PUBLIC_SUPABASE_URL=your-url\n' +
      'NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key'
    )
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey)
}