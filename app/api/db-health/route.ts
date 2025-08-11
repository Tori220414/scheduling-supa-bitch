import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Simple DB health check using Supabase client (more reliable in serverless)
export async function GET() {
  try {
    // Create Supabase client directly in the API route
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        ok: false, 
        error: "Missing Supabase environment variables",
        missing: {
          url: !supabaseUrl,
          serviceKey: !serviceRoleKey
        }
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
    
    // Test database connection by querying user_profiles table count
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      return NextResponse.json({ 
        ok: false, 
        error: countError.message,
        details: "Failed to query user_profiles table - may need to apply database schema"
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      ok: true, 
      message: "Database connected successfully",
      userProfilesCount: count,
      timestamp: new Date().toISOString()
    })

  } catch (err: any) {
    return NextResponse.json({ 
      ok: false, 
      error: err?.message ?? "DB error",
      message: "Database health check failed"
    }, { status: 500 })
  }
}
