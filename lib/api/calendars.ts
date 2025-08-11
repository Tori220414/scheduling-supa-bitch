import { getSupabase, createServerSupabaseClient } from "../supabase-client"
import { Calendar, CreateCalendarForm, UpdateCalendarForm, CalendarStatus } from "../types"

// Client-side functions
export class CalendarsAPI {
  private supabase = getSupabase()

  async getCalendars(options: {
    include_shared?: boolean
    status?: CalendarStatus[]
  } = {}): Promise<Calendar[]> {
    const { include_shared = true, status = ['active'] } = options

    let query = this.supabase
      .from("calendars")
      .select("*")
      .in("status", status)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch calendars: ${error.message}`)
    }

    let calendars = data as Calendar[] || []

    // If including shared calendars, fetch those too
    if (include_shared) {
      const sharedCalendars = await this.getSharedCalendars()
      calendars = [...calendars, ...sharedCalendars]
    }

    return calendars
  }

  async getCalendar(id: string): Promise<Calendar> {
    const { data, error } = await this.supabase
      .from("calendars")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch calendar: ${error.message}`)
    }

    return data as Calendar
  }

  async createCalendar(calendar: CreateCalendarForm): Promise<Calendar> {
    const { data: user } = await this.supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error("User not authenticated")
    }

    const { data, error } = await this.supabase
      .from("calendars")
      .insert({
        ...calendar,
        owner_id: user.user.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create calendar: ${error.message}`)
    }

    return data as Calendar
  }

  async updateCalendar(calendar: UpdateCalendarForm): Promise<Calendar> {
    const { id, ...updates } = calendar
    
    const { data, error } = await this.supabase
      .from("calendars")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update calendar: ${error.message}`)
    }

    return data as Calendar
  }

  async deleteCalendar(id: string): Promise<void> {
    // Check if this is the default calendar
    const calendar = await this.getCalendar(id)
    if (calendar.is_default) {
      throw new Error("Cannot delete the default calendar")
    }

    const { error } = await this.supabase
      .from("calendars")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(`Failed to delete calendar: ${error.message}`)
    }
  }

  async setDefaultCalendar(id: string): Promise<void> {
    const { data: user } = await this.supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error("User not authenticated")
    }

    // First, unset all default calendars for this user
    await this.supabase
      .from("calendars")
      .update({ is_default: false })
      .eq("owner_id", user.user.id)

    // Then set the specified calendar as default
    const { error } = await this.supabase
      .from("calendars")
      .update({ is_default: true })
      .eq("id", id)
      .eq("owner_id", user.user.id)

    if (error) {
      throw new Error(`Failed to set default calendar: ${error.message}`)
    }
  }

  async getDefaultCalendar(): Promise<Calendar | null> {
    const { data, error } = await this.supabase
      .from("calendars")
      .select("*")
      .eq("is_default", true)
      .eq("status", "active")
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw new Error(`Failed to fetch default calendar: ${error.message}`)
    }

    return data as Calendar || null
  }

  async getSharedCalendars(): Promise<Calendar[]> {
    const { data, error } = await this.supabase
      .from("calendar_shares")
      .select(`
        calendar:calendars!inner(*)
      `)
      .eq("accepted_at", null, { not: true }) // Only accepted shares

    if (error) {
      throw new Error(`Failed to fetch shared calendars: ${error.message}`)
    }

    return data?.map(item => item.calendar) as Calendar[] || []
  }

  async shareCalendar(calendarId: string, userEmail: string, permission: 'read' | 'write' | 'admin' = 'read'): Promise<void> {
    // First, get the user ID from email
    const { data: users, error: userError } = await this.supabase
      .from("user_profiles")
      .select("id")
      .eq("email", userEmail)
      .single()

    if (userError || !users) {
      throw new Error("User not found with that email address")
    }

    const { data: currentUser } = await this.supabase.auth.getUser()
    
    if (!currentUser.user) {
      throw new Error("User not authenticated")
    }

    const { error } = await this.supabase
      .from("calendar_shares")
      .insert({
        calendar_id: calendarId,
        user_id: users.id,
        permission,
        shared_by: currentUser.user.id,
      })

    if (error) {
      throw new Error(`Failed to share calendar: ${error.message}`)
    }
  }

  async unshareCalendar(calendarId: string, userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("calendar_shares")
      .delete()
      .eq("calendar_id", calendarId)
      .eq("user_id", userId)

    if (error) {
      throw new Error(`Failed to unshare calendar: ${error.message}`)
    }
  }

  async acceptCalendarShare(calendarId: string): Promise<void> {
    const { data: user } = await this.supabase.auth.getUser()
    
    if (!user.user) {
      throw new Error("User not authenticated")
    }

    const { error } = await this.supabase
      .from("calendar_shares")
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq("calendar_id", calendarId)
      .eq("user_id", user.user.id)

    if (error) {
      throw new Error(`Failed to accept calendar share: ${error.message}`)
    }
  }

  async getCalendarShares(calendarId: string): Promise<{
    id: string
    user: {
      id: string
      full_name: string | null
      email: string
    }
    permission: string
    shared_at: string
    accepted_at: string | null
  }[]> {
    const { data, error } = await this.supabase
      .from("calendar_shares")
      .select(`
        id,
        permission,
        shared_at,
        accepted_at,
        user_profiles!inner(id, full_name, email)
      `)
      .eq("calendar_id", calendarId)

    if (error) {
      throw new Error(`Failed to fetch calendar shares: ${error.message}`)
    }

    return data?.map(share => ({
      id: share.id,
      user: {
        id: share.user_profiles.id,
        full_name: share.user_profiles.full_name,
        email: share.user_profiles.email,
      },
      permission: share.permission,
      shared_at: share.shared_at,
      accepted_at: share.accepted_at,
    })) || []
  }

  async duplicateCalendar(id: string, newName?: string): Promise<Calendar> {
    const originalCalendar = await this.getCalendar(id)
    
    const duplicatedCalendar: CreateCalendarForm = {
      name: newName || `${originalCalendar.name} (Copy)`,
      description: originalCalendar.description,
      color: originalCalendar.color,
      type: originalCalendar.type,
    }

    return this.createCalendar(duplicatedCalendar)
  }

  async getCalendarStats(calendarId: string): Promise<{
    total_events: number
    completed_tasks: number
    pending_tasks: number
    upcoming_events: number
    overdue_events: number
  }> {
    const now = new Date().toISOString()

    const { data: totalEvents, error: totalError } = await this.supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("calendar_id", calendarId)

    const { data: completedTasks, error: completedError } = await this.supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("calendar_id", calendarId)
      .eq("status", "completed")

    const { data: pendingTasks, error: pendingError } = await this.supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("calendar_id", calendarId)
      .in("status", ["pending", "in_progress"])

    const { data: upcomingEvents, error: upcomingError } = await this.supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("calendar_id", calendarId)
      .gte("start_time", now)
      .in("status", ["pending", "in_progress"])

    const { data: overdueEvents, error: overdueError } = await this.supabase
      .from("events")
      .select("id", { count: "exact" })
      .eq("calendar_id", calendarId)
      .lt("start_time", now)
      .in("status", ["pending", "in_progress"])

    if (totalError || completedError || pendingError || upcomingError || overdueError) {
      throw new Error("Failed to fetch calendar statistics")
    }

    return {
      total_events: totalEvents?.length || 0,
      completed_tasks: completedTasks?.length || 0,
      pending_tasks: pendingTasks?.length || 0,
      upcoming_events: upcomingEvents?.length || 0,
      overdue_events: overdueEvents?.length || 0,
    }
  }
}

// Server-side functions for API routes
export class ServerCalendarsAPI {
  private supabase = createServerSupabaseClient()

  async getCalendars(userId: string, options: {
    include_shared?: boolean
    status?: CalendarStatus[]
  } = {}): Promise<Calendar[]> {
    const { include_shared = true, status = ['active'] } = options

    let query = this.supabase
      .from("calendars")
      .select("*")
      .eq("owner_id", userId)
      .in("status", status)
      .order("is_default", { ascending: false })
      .order("name", { ascending: true })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch calendars: ${error.message}`)
    }

    let calendars = data as Calendar[] || []

    // If including shared calendars, fetch those too
    if (include_shared) {
      const { data: sharedData, error: sharedError } = await this.supabase
        .from("calendar_shares")
        .select(`
          calendar:calendars!inner(*)
        `)
        .eq("user_id", userId)
        .eq("accepted_at", null, { not: true })

      if (sharedError) {
        throw new Error(`Failed to fetch shared calendars: ${sharedError.message}`)
      }

      const sharedCalendars = sharedData?.map(item => item.calendar) as Calendar[] || []
      calendars = [...calendars, ...sharedCalendars]
    }

    return calendars
  }

  // Add other server-side methods as needed...
}

// Export singleton instances
export const calendarsAPI = new CalendarsAPI()
export const serverCalendarsAPI = new ServerCalendarsAPI()