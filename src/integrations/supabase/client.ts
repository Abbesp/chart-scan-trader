import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Debug logging
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Not set')

// Create a safe fallback client when environment variables are not available
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables not configured. Using mock client.')
    // Return a mock client that won't cause crashes with proper chaining
    const mockQuery = {
      select: () => mockQuery,
      insert: () => mockQuery,
      eq: () => mockQuery,
      order: () => mockQuery,
      limit: () => Promise.resolve({ data: [], error: null }),
      data: [],
      error: null
    }
    return {
      from: () => mockQuery,
      functions: {
        invoke: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') })
      }
    }
  }
  return createClient(supabaseUrl, supabaseAnonKey)
})()