import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"

// Simple DB health check using Supabase client (more reliable in serverless)
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Test database connection by querying a simple function
    const { data, error } = await supabase.rpc('version')
    
    if (error) {
      // Fallback: try to query user_profiles table count
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        return NextResponse.json({ 
          ok: false, 
          error: countError.message,
          fallback: "Failed to query user_profiles table"
        }, { status: 500 })
      }
      
      return NextResponse.json({ 
        ok: true, 
        message: "Database connected via Supabase",
        userProfilesCount: count
      })
    }

    return NextResponse.json({ 
      ok: true, 
      version: data,
      message: "Database connected via Supabase RPC"
    })
  } catch (err: any) {
    return NextResponse.json({ 
      ok: false, 
      error: err?.message ?? "DB error",
      message: "Using Supabase client instead of raw Postgres"
    }, { status: 500 })
  }
}
