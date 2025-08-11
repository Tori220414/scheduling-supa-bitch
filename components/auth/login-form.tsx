"use client"

import * as React from "react"
import { getSupabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Activity, Mail, Lock } from "lucide-react"

export default function LoginForm() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [mode, setMode] = React.useState<"signin" | "signup">("signin")
  const [pending, setPending] = React.useState(false)
  const [message, setMessage] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setMessage(null)
    try {
      const supabase = getSupabase()
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        setMessage("Signed in successfully.")
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        setMessage("Sign up successful. Check your email for confirmation if required.")
      }
    } catch (err: any) {
      setMessage(err?.message || "Authentication failed")
    } finally {
      setPending(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          {mode === "signin" ? "Sign in" : "Create account"}
        </CardTitle>
        <CardDescription>{mode === "signin" ? "Welcome back" : "Start your journey"}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                id="email"
                type="email"
                required
                placeholder="you@example.com"
                className="pl-8"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
              <Input
                id="password"
                type="password"
                required
                placeholder="********"
                className="pl-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" disabled={pending}>
              {pending ? "Please wait..." : mode === "signin" ? "Sign in" : "Sign up"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
              {mode === "signin" ? "Create account" : "Have an account? Sign in"}
            </Button>
          </div>
          {message && (
            <p className={`text-sm ${/success|signed/i.test(message) ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
