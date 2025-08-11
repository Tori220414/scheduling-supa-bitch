import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase-client"

// Clear corrupted auth state - useful for debugging auth issues
export async function POST() {
  try {
    const supabase = createServerSupabaseClient()
    
    // Sign out on server side
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Auth state cleared successfully" 
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "Clear auth error" }, { status: 500 })
  }
}
