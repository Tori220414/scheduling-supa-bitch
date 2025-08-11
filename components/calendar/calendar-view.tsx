"use client"

import * as React from "react"
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
         addDays, isSameDay, isSameMonth, isToday, parseISO } from "date-fns"
import { CalendarProps, Event, CalendarView } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from "lucide-react"

interface CalendarViewProps extends Omit<CalendarProps, 'view'> {
  view: CalendarView
  className?: string
  onViewChange?: (view: CalendarView) => void
  onDateChange?: (date: Date) => void
  onCreateEvent?: (date: Date) => void
}

export function CalendarView({
  view,
  date,
  events = [],
  calendars = [],
  onEventClick,
  onDateClick,
  onEventDrop,
  onEventResize,
  onViewChange,
  onDateChange,
  onCreateEvent,
  className
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(date)

  React.useEffect(() => {
    setCurrentDate(date)
  }, [date])

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate: Date
    
    switch (view) {
      case 'month':
        newDate = direction === 'prev' 
          ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
          : new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
        break
      case 'week':
        newDate = direction === 'prev'
          ? addDays(currentDate, -7)
          : addDays(currentDate, 7)
        break
      case 'day':
        newDate = direction === 'prev'
          ? addDays(currentDate, -1)
          : addDays(currentDate, 1)
        break
      default:
        newDate = currentDate
    }
    
    setCurrentDate(newDate)
    onDateChange?.(newDate)
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange?.(today)
  }

  const getEventsForDate = (targetDate: Date): Event[] => {
    return events.filter(event => {
      const eventDate = parseISO(event.start_time)
      return isSameDay(eventDate, targetDate)
    })
  }

  const getCalendarColor = (calendarId: string): string => {
    const calendar = calendars.find(c => c.id === calendarId)
    return calendar?.color || '#6366f1'
  }

  const handleDateClick = (clickedDate: Date) => {
    onDateClick?.(clickedDate)
    onCreateEvent?.(clickedDate)
  }

  const renderViewSelector = () => (
    <div className="flex gap-1">
      {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map((viewOption) => (
        <Button
          key={viewOption}
          variant={view === viewOption ? "default" : "outline"}
          size="sm"
          onClick={() => onViewChange?.(viewOption)}
          className="capitalize"
        >
          {viewOption}
        </Button>
      ))}
    </div>
  )

  const renderHeader = () => {
    const title = format(currentDate, 
      view === 'month' ? 'MMMM yyyy' : 
      view === 'week' ? "'Week of' MMM d, yyyy" : 
      'EEEE, MMM d, yyyy'
    )

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {renderViewSelector()}
      </div>
    )
  }

  const renderEventItem = (event: Event, compact: boolean = false) => {
    const eventDate = parseISO(event.start_time)
    const eventTime = format(eventDate, 'h:mm a')
    const calendarColor = getCalendarColor(event.calendar_id)
    
    return (
      <div
        key={event.id}
        className={cn(
          "group cursor-pointer rounded px-2 py-1 text-xs font-medium transition-colors",
          compact ? "mb-1" : "mb-2 p-2",
          "hover:opacity-80"
        )}
        style={{ 
          backgroundColor: `${calendarColor}20`,
          borderLeft: `3px solid ${calendarColor}`
        }}
        onClick={() => onEventClick?.(event)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium text-gray-900">
              {event.title}
            </div>
            {!event.all_day && (
              <div className="text-gray-500 text-xs">
                {eventTime}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            <Badge 
              variant="outline" 
              className="text-xs"
              style={{ borderColor: calendarColor, color: calendarColor }}
            >
              {event.status}
            </Badge>
            {event.priority === 'high' && (
              <div className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const dateFormat = "d"
    const rows = []
    let days = []
    let day = startDate
    
    // Header row
    const headerDays = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    dayNames.forEach(dayName => {
      headerDays.push(
        <div key={dayName} className="p-3 text-center font-semibold text-gray-600">
          {dayName}
        </div>
      )
    })
    rows.push(
      <div key="header" className="grid grid-cols-7 border-b bg-gray-50">
        {headerDays}
      </div>
    )

    // Calendar days
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const dayEvents = getEventsForDate(day)
        const isCurrentMonth = isSameMonth(day, monthStart)
        const isCurrentDay = isToday(day)
        const dayNumber = format(day, dateFormat)

        days.push(
          <div
            key={day.toString()}
            className={cn(
              "min-h-[120px] p-2 border-r border-b cursor-pointer hover:bg-gray-50 transition-colors",
              !isCurrentMonth && "bg-gray-50 text-gray-400",
              isCurrentDay && "bg-blue-50 border-blue-200"
            )}
            onClick={() => handleDateClick(day)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={cn(
                "text-sm font-medium",
                isCurrentDay && "bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
              )}>
                {dayNumber}
              </span>
              {dayEvents.length > 0 && (
                <Plus className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <div className="space-y-1">
              {dayEvents.slice(0, 3).map(event => renderEventItem(event, true))}
              {dayEvents.length > 3 && (
                <div className="text-xs text-gray-500 px-1">
                  +{dayEvents.length - 3} more
                </div>
              )}
            </div>
          </div>
        )
        day = addDays(day, 1)
      }
      rows.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      )
      days = []
    }

    return <div className="border rounded-lg overflow-hidden bg-white">{rows}</div>
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="border rounded-lg overflow-hidden bg-white">
        {/* Week header */}
        <div className="grid grid-cols-8 border-b bg-gray-50">
          <div className="p-3 border-r"></div>
          {weekDays.map(day => (
            <div key={day.toString()} className="p-3 text-center border-r">
              <div className="text-sm font-semibold text-gray-600">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                "text-lg font-bold mt-1",
                isToday(day) && "bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="max-h-[600px] overflow-y-auto">
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="grid grid-cols-8 border-b min-h-[60px]">
              <div className="p-2 border-r bg-gray-50 text-xs text-gray-600 text-center">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
              {weekDays.map(day => {
                const hourEvents = getEventsForDate(day).filter(event => {
                  const eventHour = parseISO(event.start_time).getHours()
                  return eventHour === hour
                })
                
                return (
                  <div
                    key={`${day.toString()}-${hour}`}
                    className="p-1 border-r hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleDateClick(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour))}
                  >
                    {hourEvents.map(event => renderEventItem(event, true))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDate(currentDate).sort((a, b) => 
      parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime()
    )

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Time slots */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {Array.from({ length: 24 }, (_, hour) => {
                  const hourEvents = dayEvents.filter(event => {
                    const eventHour = parseISO(event.start_time).getHours()
                    return eventHour === hour
                  })
                  
                  return (
                    <div key={hour} className="flex border-b min-h-[60px]">
                      <div className="w-16 p-2 border-r bg-gray-50 text-xs text-gray-600 text-center">
                        {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                      </div>
                      <div
                        className="flex-1 p-2 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hour))}
                      >
                        {hourEvents.map(event => renderEventItem(event))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day summary */}
        <div>
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(currentDate, 'EEEE, MMM d')}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Events:</span>
                  <Badge variant="secondary">{dayEvents.length}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed:</span>
                  <Badge variant="secondary">
                    {dayEvents.filter(e => e.status === 'completed').length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Pending:</span>
                  <Badge variant="secondary">
                    {dayEvents.filter(e => e.status === 'pending').length}
                  </Badge>
                </div>
                
                {dayEvents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium text-sm mb-3">Upcoming Events</h4>
                    <div className="space-y-2">
                      {dayEvents.slice(0, 5).map(event => (
                        <div
                          key={event.id}
                          className="p-2 rounded border cursor-pointer hover:bg-gray-50"
                          onClick={() => onEventClick?.(event)}
                        >
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-gray-500">
                            {format(parseISO(event.start_time), 'h:mm a')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const renderAgendaView = () => {
    const upcomingEvents = events
      .filter(event => parseISO(event.start_time) >= new Date())
      .sort((a, b) => parseISO(a.start_time).getTime() - parseISO(b.start_time).getTime())
      .slice(0, 50)

    const groupedEvents = upcomingEvents.reduce((groups, event) => {
      const dateKey = format(parseISO(event.start_time), 'yyyy-MM-dd')
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(event)
      return groups
    }, {} as Record<string, Event[]>)

    return (
      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([dateKey, dateEvents]) => (
          <Card key={dateKey}>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {format(parseISO(dateKey), 'EEEE, MMMM d, yyyy')}
                <Badge variant="secondary">{dateEvents.length}</Badge>
              </h3>
              <div className="space-y-2">
                {dateEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 p-3 rounded hover:bg-gray-50 cursor-pointer border"
                    onClick={() => onEventClick?.(event)}
                  >
                    <div
                      className="w-1 h-12 rounded"
                      style={{ backgroundColor: getCalendarColor(event.calendar_id) }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      {event.description && (
                        <div className="text-sm text-gray-600 mt-1">
                          {event.description.slice(0, 100)}
                          {event.description.length > 100 && '...'}
                        </div>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{format(parseISO(event.start_time), 'h:mm a')}</span>
                        {event.end_time && (
                          <span>- {format(parseISO(event.end_time), 'h:mm a')}</span>
                        )}
                        <Badge variant="outline" size="sm">{event.type}</Badge>
                        <Badge 
                          variant="outline" 
                          size="sm"
                          className={cn(
                            event.priority === 'high' && "border-red-200 text-red-700",
                            event.priority === 'medium' && "border-yellow-200 text-yellow-700",
                            event.priority === 'low' && "border-green-200 text-green-700"
                          )}
                        >
                          {event.priority}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {Object.keys(groupedEvents).length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">No upcoming events</h3>
              <p className="text-gray-500 mb-4">
                You don't have any events scheduled for the upcoming days.
              </p>
              <Button onClick={() => onCreateEvent?.(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  const renderCalendarContent = () => {
    switch (view) {
      case 'month':
        return renderMonthView()
      case 'week':
        return renderWeekView()
      case 'day':
        return renderDayView()
      case 'agenda':
        return renderAgendaView()
      default:
        return renderMonthView()
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {renderHeader()}
      {renderCalendarContent()}
    </div>
  )
}