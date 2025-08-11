"use client"

import { useState, useEffect, useMemo } from "react"
import { eventsAPI } from "../api/events"
import { Event, EventFilters, CreateEventForm, UpdateEventForm } from "../types"
import { toast } from "sonner"

export interface UseEventsOptions {
  calendar_ids?: string[]
  start_date?: string
  end_date?: string
  filters?: EventFilters
  auto_refresh?: boolean
  refresh_interval?: number
}

export function useEvents(options: UseEventsOptions = {}) {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    calendar_ids,
    start_date,
    end_date,
    filters,
    auto_refresh = false,
    refresh_interval = 30000, // 30 seconds
  } = options

  const fetchEvents = async () => {
    try {
      setError(null)
      const result = await eventsAPI.getEvents({
        calendar_ids,
        start_date,
        end_date,
        filters,
      })
      setEvents(result.data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch events"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createEvent = async (eventData: CreateEventForm): Promise<Event | null> => {
    try {
      const newEvent = await eventsAPI.createEvent(eventData)
      setEvents(prev => [...prev, newEvent])
      toast.success("Event created successfully")
      return newEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create event"
      toast.error(errorMessage)
      return null
    }
  }

  const updateEvent = async (eventData: UpdateEventForm): Promise<Event | null> => {
    try {
      const updatedEvent = await eventsAPI.updateEvent(eventData)
      setEvents(prev => prev.map(event => 
        event.id === eventData.id ? updatedEvent : event
      ))
      toast.success("Event updated successfully")
      return updatedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update event"
      toast.error(errorMessage)
      return null
    }
  }

  const deleteEvent = async (eventId: string): Promise<boolean> => {
    try {
      await eventsAPI.deleteEvent(eventId)
      setEvents(prev => prev.filter(event => event.id !== eventId))
      toast.success("Event deleted successfully")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete event"
      toast.error(errorMessage)
      return false
    }
  }

  const duplicateEvent = async (eventId: string, newStartTime?: string): Promise<Event | null> => {
    try {
      const duplicatedEvent = await eventsAPI.duplicateEvent(eventId, newStartTime)
      setEvents(prev => [...prev, duplicatedEvent])
      toast.success("Event duplicated successfully")
      return duplicatedEvent
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to duplicate event"
      toast.error(errorMessage)
      return null
    }
  }

  const completeTask = async (eventId: string): Promise<boolean> => {
    try {
      const completedEvent = await eventsAPI.completeTask(eventId)
      setEvents(prev => prev.map(event => 
        event.id === eventId ? completedEvent : event
      ))
      toast.success("Task completed!")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete task"
      toast.error(errorMessage)
      return false
    }
  }

  const updateTaskProgress = async (eventId: string, progress: number): Promise<boolean> => {
    try {
      const updatedEvent = await eventsAPI.updateTaskProgress(eventId, progress)
      setEvents(prev => prev.map(event => 
        event.id === eventId ? updatedEvent : event
      ))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update task progress"
      toast.error(errorMessage)
      return false
    }
  }

  // Computed values
  const eventsByStatus = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.status]) {
        acc[event.status] = []
      }
      acc[event.status].push(event)
      return acc
    }, {} as Record<string, Event[]>)
  }, [events])

  const eventsByType = useMemo(() => {
    return events.reduce((acc, event) => {
      if (!acc[event.type]) {
        acc[event.type] = []
      }
      acc[event.type].push(event)
      return acc
    }, {} as Record<string, Event[]>)
  }, [events])

  const upcomingEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter(event => {
        const eventStart = new Date(event.start_time)
        return eventStart > now && ['pending', 'in_progress'].includes(event.status)
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 10) // Top 10 upcoming events
  }, [events])

  const overdueEvents = useMemo(() => {
    const now = new Date()
    return events
      .filter(event => {
        const eventStart = new Date(event.start_time)
        return eventStart < now && ['pending', 'in_progress'].includes(event.status)
      })
      .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
  }, [events])

  const completedEvents = useMemo(() => {
    return events.filter(event => event.status === 'completed')
  }, [events])

  const stats = useMemo(() => {
    const total = events.length
    const completed = completedEvents.length
    const pending = events.filter(e => e.status === 'pending').length
    const inProgress = events.filter(e => e.status === 'in_progress').length
    const overdue = overdueEvents.length
    const upcoming = upcomingEvents.length
    
    return {
      total,
      completed,
      pending,
      in_progress: inProgress,
      overdue,
      upcoming,
      completion_rate: total > 0 ? Math.round((completed / total) * 100) : 0,
    }
  }, [events, completedEvents, overdueEvents, upcomingEvents])

  // Initial fetch and auto-refresh setup
  useEffect(() => {
    fetchEvents()

    let interval: NodeJS.Timeout | null = null
    if (auto_refresh) {
      interval = setInterval(fetchEvents, refresh_interval)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [calendar_ids, start_date, end_date, filters, auto_refresh, refresh_interval])

  return {
    // Data
    events,
    eventsByStatus,
    eventsByType,
    upcomingEvents,
    overdueEvents,
    completedEvents,
    stats,
    
    // State
    loading,
    error,
    
    // Actions
    refetch: fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    completeTask,
    updateTaskProgress,
  }
}

// Hook for a single event
export function useEvent(eventId: string | null) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(!!eventId)
  const [error, setError] = useState<string | null>(null)

  const fetchEvent = async () => {
    if (!eventId) {
      setEvent(null)
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)
      const eventData = await eventsAPI.getEvent(eventId)
      setEvent(eventData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch event"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEvent()
  }, [eventId])

  return {
    event,
    loading,
    error,
    refetch: fetchEvent,
  }
}

// Hook for searching events
export function useEventSearch() {
  const [results, setResults] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const search = async (query: string, options: {
    calendar_ids?: string[]
    limit?: number
  } = {}) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    try {
      setError(null)
      setLoading(true)
      const searchResults = await eventsAPI.searchEvents(query, options)
      setResults(searchResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Search failed"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => {
    setResults([])
    setError(null)
  }

  return {
    results,
    loading,
    error,
    search,
    clearResults,
  }
}
