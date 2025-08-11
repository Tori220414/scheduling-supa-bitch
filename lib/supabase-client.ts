import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Database } from "./types"

// Client-side Supabase client
let clientSupabase: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  // During SSR, return a mock client that won't break the build
  if (typeof window === 'undefined') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxMjM0NTYsImV4cCI6MjAyMDY5OTQ1Nn0.placeholder'
    
    // Return a basic client for SSR - auth operations will be no-ops
    return createClient<Database>(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  if (clientSupabase) return clientSupabase

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }

  clientSupabase = createClient<Database>(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'scheduling-app',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 2,
      },
    },
  })
  return clientSupabase
}

// Create a server-side client for API routes (server-only)
export function createServerSupabaseClient() {
  // This function should only be called on the server side
  if (typeof window !== 'undefined') {
    throw new Error("createServerSupabaseClient() should only be called on the server side")
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing server-side Supabase configuration")
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
