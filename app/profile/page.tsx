"use client"

import { withAuth } from "@/lib/auth-context"
import { ProfileForm } from "@/components/profile/profile-form"
import { TopNav } from "@/components/top-nav"

function ProfilePage() {
  return (
    <main className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto py-8">
        <ProfileForm />
      </div>
    </main>
  )
}

export default withAuth(ProfilePage)
