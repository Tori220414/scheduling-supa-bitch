import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"

// Test Supabase server-side client and check if tables exist
export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Test connection by checking if user_profiles table exists
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json({ 
        ok: true,
        message: "Supabase connected but user_profiles table missing",
        error: error.message,
        needsSchema: true
      })
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Supabase working and schema applied",
      userProfilesCount: data
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Supabase error" }, { status: 500 })
  }
}
