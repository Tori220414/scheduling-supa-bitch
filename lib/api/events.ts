import { getSupabase, createServerSupabaseClient } from "../supabase-client"
import { Event, CreateEventForm, UpdateEventForm, EventFilters, PaginatedResponse } from "../types"

// Client-side functions
export class EventsAPI {
  private supabase = getSupabase()

  async getEvents(options: {
    calendar_ids?: string[]
    start_date?: string
    end_date?: string
    filters?: EventFilters
    page?: number
    limit?: number
  } = {}): Promise<PaginatedResponse<Event>> {
    const { calendar_ids, start_date, end_date, filters = {}, page = 1, limit = 50 } = options

    let query = this.supabase
      .from("events")
      .select("*", { count: "exact" })
      .order("start_time", { ascending: true })

    // Apply calendar filter
    if (calendar_ids && calendar_ids.length > 0) {
      query = query.in("calendar_id", calendar_ids)
    }

    // Apply date range filter
    if (start_date) {
      query = query.gte("start_time", start_date)
    }
    if (end_date) {
      query = query.lte("start_time", end_date)
    }

    // Apply additional filters
    if (filters.types && filters.types.length > 0) {
      query = query.in("type", filters.types)
    }
    if (filters.statuses && filters.statuses.length > 0) {
      query = query.in("status", filters.statuses)
    }
    if (filters.priorities && filters.priorities.length > 0) {
      query = query.in("priority", filters.priorities)
    }
    if (filters.category_ids && filters.category_ids.length > 0) {
      query = query.in("category_id", filters.category_ids)
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    if (filters.tags && filters.tags.length > 0) {
      query = query.overlaps("tags", filters.tags)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return {
      data: data as Event[] || [],
      total: count || 0,
      page,
      limit,
      has_next: count ? (page * limit) < count : false,
      has_prev: page > 1
    }
  }

  async getEvent(id: string): Promise<Event> {
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      throw new Error(`Failed to fetch event: ${error.message}`)
    }

    return data as Event
  }

  async createEvent(event: CreateEventForm): Promise<Event> {
    const { data, error } = await this.supabase
      .from("events")
      .insert({
        ...event,
        created_by: (await this.supabase.auth.getUser()).data.user!.id,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create event: ${error.message}`)
    }

    return data as Event
  }

  async updateEvent(event: UpdateEventForm): Promise<Event> {
    const { id, ...updates } = event
    
    const { data, error } = await this.supabase
      .from("events")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update event: ${error.message}`)
    }

    return data as Event
  }

  async deleteEvent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("events")
      .delete()
      .eq("id", id)

    if (error) {
      throw new Error(`Failed to delete event: ${error.message}`)
    }
  }

  async duplicateEvent(id: string, newStartTime?: string): Promise<Event> {
    const originalEvent = await this.getEvent(id)
    
    const duplicatedEvent: CreateEventForm = {
      title: `${originalEvent.title} (Copy)`,
      description: originalEvent.description,
      type: originalEvent.type,
      priority: originalEvent.priority,
      start_time: newStartTime || originalEvent.start_time,
      end_time: originalEvent.end_time,
      all_day: originalEvent.all_day,
      location: originalEvent.location,
      meeting_url: originalEvent.meeting_url,
      calendar_id: originalEvent.calendar_id,
      category_id: originalEvent.category_id,
      tags: originalEvent.tags,
    }

    return this.createEvent(duplicatedEvent)
  }

  async bulkUpdateEvents(eventIds: string[], updates: Partial<Event>): Promise<Event[]> {
    const { data, error } = await this.supabase
      .from("events")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .in("id", eventIds)
      .select()

    if (error) {
      throw new Error(`Failed to bulk update events: ${error.message}`)
    }

    return data as Event[]
  }

  async getEventsByDateRange(startDate: string, endDate: string, calendarIds?: string[]): Promise<Event[]> {
    let query = this.supabase
      .from("events")
      .select("*")
      .gte("start_time", startDate)
      .lte("start_time", endDate)
      .order("start_time", { ascending: true })

    if (calendarIds && calendarIds.length > 0) {
      query = query.in("calendar_id", calendarIds)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch events by date range: ${error.message}`)
    }

    return data as Event[]
  }

  async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .gte("start_time", now)
      .in("status", ["pending", "in_progress"])
      .order("start_time", { ascending: true })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch upcoming events: ${error.message}`)
    }

    return data as Event[]
  }

  async getOverdueEvents(): Promise<Event[]> {
    const now = new Date().toISOString()
    
    const { data, error } = await this.supabase
      .from("events")
      .select("*")
      .lt("start_time", now)
      .in("status", ["pending", "in_progress"])
      .order("start_time", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch overdue events: ${error.message}`)
    }

    return data as Event[]
  }

  async searchEvents(query: string, options: {
    calendar_ids?: string[]
    limit?: number
  } = {}): Promise<Event[]> {
    const { calendar_ids, limit = 20 } = options

    let searchQuery = this.supabase
      .from("events")
      .select("*")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`)
      .order("start_time", { ascending: true })
      .limit(limit)

    if (calendar_ids && calendar_ids.length > 0) {
      searchQuery = searchQuery.in("calendar_id", calendar_ids)
    }

    const { data, error } = await searchQuery

    if (error) {
      throw new Error(`Failed to search events: ${error.message}`)
    }

    return data as Event[]
  }

  // Task-specific methods
  async completeTask(id: string, completedAt?: string): Promise<Event> {
    return this.updateEvent({
      id,
      status: "completed",
      progress_percentage: 100,
      completed_at: completedAt || new Date().toISOString(),
    })
  }

  async updateTaskProgress(id: string, progress: number): Promise<Event> {
    const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "pending"
    const completedAt = progress === 100 ? new Date().toISOString() : null

    return this.updateEvent({
      id,
      status,
      progress_percentage: progress,
      completed_at: completedAt,
    })
  }

  async getTasksByStatus(status: Event['status'], calendarIds?: string[]): Promise<Event[]> {
    let query = this.supabase
      .from("events")
      .select("*")
      .eq("status", status)
      .in("type", ["task", "deadline", "milestone"])
      .order("start_time", { ascending: true })

    if (calendarIds && calendarIds.length > 0) {
      query = query.in("calendar_id", calendarIds)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks by status: ${error.message}`)
    }

    return data as Event[]
  }
}

// Server-side functions for API routes
export class ServerEventsAPI {
  private supabase = createServerSupabaseClient()

  async getEvents(userId: string, options: {
    calendar_ids?: string[]
    start_date?: string
    end_date?: string
    filters?: EventFilters
    page?: number
    limit?: number
  } = {}): Promise<PaginatedResponse<Event>> {
    // Similar to client-side but with RLS handled server-side
    // Implementation would be similar to client-side but with user ID filtering
    const { calendar_ids, start_date, end_date, filters = {}, page = 1, limit = 50 } = options

    let query = this.supabase
      .from("events")
      .select(`
        *,
        calendar:calendars!inner(id, owner_id)
      `, { count: "exact" })
      .eq("calendar.owner_id", userId)
      .order("start_time", { ascending: true })

    // Apply filters (same as client-side)
    if (calendar_ids && calendar_ids.length > 0) {
      query = query.in("calendar_id", calendar_ids)
    }

    if (start_date) {
      query = query.gte("start_time", start_date)
    }
    if (end_date) {
      query = query.lte("start_time", end_date)
    }

    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch events: ${error.message}`)
    }

    return {
      data: data as Event[] || [],
      total: count || 0,
      page,
      limit,
      has_next: count ? (page * limit) < count : false,
      has_prev: page > 1
    }
  }

  // Add other server-side methods as needed...
}

// Export singleton instances
export const eventsAPI = new EventsAPI()
export const serverEventsAPI = new ServerEventsAPI()