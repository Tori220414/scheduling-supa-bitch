import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { Database } from "./types"

// Client-side Supabase client
let clientSupabase: SupabaseClient<Database> | null = null

export function getSupabase(): SupabaseClient<Database> {
  // This function should only be called on the client side
  if (typeof window === 'undefined') {
    throw new Error("getSupabase() should only be called on the client side")
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
