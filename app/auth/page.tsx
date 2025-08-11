"use client"
import LoginForm from "@/components/auth/login-form"
import { TopNav } from "@/components/top-nav"

export default function AuthPage() {
  return (
    <main className="min-h-screen bg-white">
      <TopNav />
      <div className="mx-auto max-w-5xl p-6">
        <LoginForm />
      </div>
    </main>
  )
}
