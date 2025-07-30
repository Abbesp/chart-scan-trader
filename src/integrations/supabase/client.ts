import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables not found. Please check your Supabase integration.')
  throw new Error('Supabase configuration missing. Make sure your Supabase integration is properly set up.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)