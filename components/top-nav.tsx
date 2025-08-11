"use client"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { CircleUserRound, LogIn, LogOut, Home, LayoutDashboard } from "lucide-react"

export function TopNav() {
  const { user, loading } = useAuth()

  async function signOut() {
    try {
      const { getSupabase } = await import("@/lib/supabase-client")
      const supabase = getSupabase()
      await supabase.auth.signOut()
    } catch (e: any) {
      console.error("Sign out failed:", e?.message)
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

          {user && (
            <Link href="/dashboard" className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          )}

          <Link href="/auth" className="text-sm text-neutral-600 hover:text-neutral-900">
            Auth
          </Link>
          <Link href="/health" className="text-sm text-neutral-600 hover:text-neutral-900">
            Health
          </Link>
        </div>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">{user.email}</span>
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
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
