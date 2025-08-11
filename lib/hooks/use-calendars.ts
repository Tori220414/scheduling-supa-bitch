"use client"

import { useState, useEffect } from "react"
import { calendarsAPI } from "../api/calendars"
import { Calendar, CreateCalendarForm, UpdateCalendarForm, CalendarStatus } from "../types"
import { toast } from "sonner"

export interface UseCalendarsOptions {
  include_shared?: boolean
  status?: CalendarStatus[]
  auto_refresh?: boolean
}

export function useCalendars(options: UseCalendarsOptions = {}) {
  const [calendars, setCalendars] = useState<Calendar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const {
    include_shared = true,
    status = ['active'],
    auto_refresh = false,
  } = options

  const fetchCalendars = async () => {
    try {
      setError(null)
      const calendarData = await calendarsAPI.getCalendars({
        include_shared,
        status,
      })
      setCalendars(calendarData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch calendars"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const createCalendar = async (calendarData: CreateCalendarForm): Promise<Calendar | null> => {
    try {
      const newCalendar = await calendarsAPI.createCalendar(calendarData)
      setCalendars(prev => [...prev, newCalendar])
      toast.success("Calendar created successfully")
      return newCalendar
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create calendar"
      toast.error(errorMessage)
      return null
    }
  }

  const updateCalendar = async (calendarData: UpdateCalendarForm): Promise<Calendar | null> => {
    try {
      const updatedCalendar = await calendarsAPI.updateCalendar(calendarData)
      setCalendars(prev => prev.map(calendar => 
        calendar.id === calendarData.id ? updatedCalendar : calendar
      ))
      toast.success("Calendar updated successfully")
      return updatedCalendar
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update calendar"
      toast.error(errorMessage)
      return null
    }
  }

  const deleteCalendar = async (calendarId: string): Promise<boolean> => {
    try {
      await calendarsAPI.deleteCalendar(calendarId)
      setCalendars(prev => prev.filter(calendar => calendar.id !== calendarId))
      toast.success("Calendar deleted successfully")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete calendar"
      toast.error(errorMessage)
      return false
    }
  }

  const setDefaultCalendar = async (calendarId: string): Promise<boolean> => {
    try {
      await calendarsAPI.setDefaultCalendar(calendarId)
      setCalendars(prev => prev.map(calendar => ({
        ...calendar,
        is_default: calendar.id === calendarId
      })))
      toast.success("Default calendar updated")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to set default calendar"
      toast.error(errorMessage)
      return false
    }
  }

  const shareCalendar = async (
    calendarId: string, 
    userEmail: string, 
    permission: 'read' | 'write' | 'admin' = 'read'
  ): Promise<boolean> => {
    try {
      await calendarsAPI.shareCalendar(calendarId, userEmail, permission)
      toast.success(`Calendar shared with ${userEmail}`)
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to share calendar"
      toast.error(errorMessage)
      return false
    }
  }

  const unshareCalendar = async (calendarId: string, userId: string): Promise<boolean> => {
    try {
      await calendarsAPI.unshareCalendar(calendarId, userId)
      toast.success("Calendar access removed")
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to remove calendar access"
      toast.error(errorMessage)
      return false
    }
  }

  const acceptCalendarShare = async (calendarId: string): Promise<boolean> => {
    try {
      await calendarsAPI.acceptCalendarShare(calendarId)
      toast.success("Calendar share accepted")
      await fetchCalendars() // Refresh to show the accepted calendar
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to accept calendar share"
      toast.error(errorMessage)
      return false
    }
  }

  const duplicateCalendar = async (calendarId: string, newName?: string): Promise<Calendar | null> => {
    try {
      const duplicatedCalendar = await calendarsAPI.duplicateCalendar(calendarId, newName)
      setCalendars(prev => [...prev, duplicatedCalendar])
      toast.success("Calendar duplicated successfully")
      return duplicatedCalendar
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to duplicate calendar"
      toast.error(errorMessage)
      return null
    }
  }

  // Computed values
  const defaultCalendar = calendars.find(calendar => calendar.is_default) || null
  const ownedCalendars = calendars.filter(calendar => calendar.type !== 'shared')
  const sharedCalendars = calendars.filter(calendar => calendar.type === 'shared')
  const activeCalendars = calendars.filter(calendar => calendar.status === 'active')

  // Initial fetch
  useEffect(() => {
    fetchCalendars()

    let interval: NodeJS.Timeout | null = null
    if (auto_refresh) {
      interval = setInterval(fetchCalendars, 60000) // Refresh every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [include_shared, status, auto_refresh])

  return {
    // Data
    calendars,
    defaultCalendar,
    ownedCalendars,
    sharedCalendars,
    activeCalendars,
    
    // State
    loading,
    error,
    
    // Actions
    refetch: fetchCalendars,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    setDefaultCalendar,
    shareCalendar,
    unshareCalendar,
    acceptCalendarShare,
    duplicateCalendar,
  }
}

// Hook for a single calendar
export function useCalendar(calendarId: string | null) {
  const [calendar, setCalendar] = useState<Calendar | null>(null)
  const [loading, setLoading] = useState(!!calendarId)
  const [error, setError] = useState<string | null>(null)

  const fetchCalendar = async () => {
    if (!calendarId) {
      setCalendar(null)
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)
      const calendarData = await calendarsAPI.getCalendar(calendarId)
      setCalendar(calendarData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch calendar"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCalendar()
  }, [calendarId])

  return {
    calendar,
    loading,
    error,
    refetch: fetchCalendar,
  }
}

// Hook for calendar shares
export function useCalendarShares(calendarId: string | null) {
  const [shares, setShares] = useState<{
    id: string
    user: {
      id: string
      full_name: string | null
      email: string
    }
    permission: string
    shared_at: string
    accepted_at: string | null
  }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchShares = async () => {
    if (!calendarId) {
      setShares([])
      return
    }

    try {
      setError(null)
      setLoading(true)
      const sharesData = await calendarsAPI.getCalendarShares(calendarId)
      setShares(sharesData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch calendar shares"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShares()
  }, [calendarId])

  return {
    shares,
    loading,
    error,
    refetch: fetchShares,
  }
}

// Hook for calendar statistics
export function useCalendarStats(calendarId: string | null) {
  const [stats, setStats] = useState<{
    total_events: number
    completed_tasks: number
    pending_tasks: number
    upcoming_events: number
    overdue_events: number
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!calendarId) {
      setStats(null)
      return
    }

    try {
      setError(null)
      setLoading(true)
      const statsData = await calendarsAPI.getCalendarStats(calendarId)
      setStats(statsData)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch calendar statistics"
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [calendarId])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}