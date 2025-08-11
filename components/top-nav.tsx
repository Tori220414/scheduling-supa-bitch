"use client"

import * as React from "react"
import Link from "next/link"
import { getSupabase } from "@/lib/supabase-client"
import { Button } from "@/components/ui/button"
import { CircleUserRound, LogIn, LogOut, Home } from "lucide-react"

export function TopNav() {
  const [authed, setAuthed] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let unsub = () => {}
    async function init() {
      try {
        const supabase = getSupabase()
        const { data } = await supabase.auth.getSession()
        setAuthed(!!data.session)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
          setAuthed(!!session)
        })
        unsub = () => listener.subscription.unsubscribe()
      } catch (e: any) {
        setError(e?.message || "Supabase not configured")
      }
    }
    init()
    return () => unsub()
  }, [])

  async function signOut() {
    try {
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch (e: any) {
      setError(e?.message || "Sign out failed")
    }
  }

  return (
    <header className="border-b bg-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Home className="h-4 w-4" />
            <span>SchedulingBitch</span>
          </Link>
          <Link href="/auth" className="text-sm text-neutral-600 hover:text-neutral-900">
            Auth
          </Link>
          <Link href="/health" className="text-sm text-neutral-600 hover:text-neutral-900">
            Health
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {error ? (
            <span className="text-xs text-red-600">{error}</span>
          ) : authed ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          ) : (
            <Link href="/auth">
              <Button variant="default" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </Button>
            </Link>
          )}
          <CircleUserRound className="ml-1 h-5 w-5 text-neutral-700" aria-hidden="true" />
        </div>
      </nav>
    </header>
  )
}
