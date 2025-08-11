"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { getSupabase } from "./supabase-client"
import { UserProfile, AuthUser, AuthContextType } from "./types"

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = getSupabase()

  // Load user profile data
  const loadUserProfile = async (authUser: User): Promise<UserProfile | undefined> => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (error) {
        console.error("Error loading user profile:", error)
        return undefined
      }

      return data as UserProfile
    } catch (error) {
      console.error("Error loading user profile:", error)
      return undefined
    }
  }

  // Create or update user profile
  const ensureUserProfile = async (authUser: User): Promise<UserProfile | undefined> => {
    try {
      // First try to get existing profile
      const { data: existingProfile } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authUser.id)
        .single()

      if (existingProfile) {
        return existingProfile as UserProfile
      }

      // Create new profile if it doesn't exist
      const newProfile: UserProfile = {
        id: authUser.id,
        username: authUser.email?.split("@")[0] || null,
        full_name: authUser.user_metadata?.full_name || authUser.email || null,
        avatar_url: authUser.user_metadata?.avatar_url || null,
        bio: null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        preferred_language: "en",
        date_format: "MM/dd/yyyy",
        time_format: "12h",
        work_hours_start: "09:00",
        work_hours_end: "17:00",
        work_days: [1, 2, 3, 4, 5], // Monday to Friday
        email_notifications: true,
        push_notifications: true,
        theme: "light",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .insert(newProfile)
        .select()
        .single()

      if (error) {
        console.error("Error creating user profile:", error)
        return undefined
      }

      return data as UserProfile
    } catch (error) {
      console.error("Error ensuring user profile:", error)
      return undefined
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user && mounted) {
          const profile = await ensureUserProfile(session.user)
          setUser({
            id: session.user.id,
            email: session.user.email!,
            profile
          })
        }
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (session?.user) {
          let profile: UserProfile | undefined
          
          // For new sign-ups, ensure profile exists
          if (event === "SIGNED_UP" || event === "SIGNED_IN") {
            profile = await ensureUserProfile(session.user)
          } else {
            profile = await loadUserProfile(session.user)
          }

          setUser({
            id: session.user.id,
            email: session.user.email!,
            profile
          })
        } else {
          setUser(null)
        }
        
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const signIn = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const signUp = async (email: string, password: string): Promise<void> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user?.id) {
      throw new Error("No user logged in")
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      throw new Error(error.message)
    }

    // Update local user state
    if (user.profile) {
      setUser({
        ...user,
        profile: {
          ...user.profile,
          ...updates,
          updated_at: new Date().toISOString(),
        }
      })
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Higher-order component for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthenticatedComponent(props: P) {
    const { user, loading } = useAuth()

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-gray-600 mb-6">Please sign in to access this page.</p>
            <a
              href="/auth"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Sign In
            </a>
          </div>
        </div>
      )
    }

    return <Component {...props} />
  }
}