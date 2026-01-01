import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0
}

// Create client only if configured
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Service role client for server-side operations that need elevated privileges
export const createServiceClient = () => {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  if (!serviceKey || !supabaseUrl) {
    console.warn('Service role key or URL not configured')
    return supabase // Fall back to anon client
  }
  return createClient(supabaseUrl, serviceKey)
}

// Check if Management API is configured
export const isManagementApiConfigured = () => {
  return !!process.env.SUPABASE_ACCESS_TOKEN
}

// Get environment status
export const getEnvStatus = () => ({
  supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAccessToken: !!process.env.SUPABASE_ACCESS_TOKEN,
})
