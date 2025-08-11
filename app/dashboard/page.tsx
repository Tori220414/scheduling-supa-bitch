"use client"

import * as React from "react"
import { withAuth } from "@/lib/auth-context"
import { useEvents } from "@/lib/hooks/use-events"
import { useCalendars } from "@/lib/hooks/use-calendars"
import { CalendarView } from "@/components/calendar/calendar-view"
import { EventForm } from "@/components/events/event-form"
import { TopNav } from "@/components/top-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Calendar, CalendarView as CalendarViewType, Event, CreateEventForm, UpdateEventForm } from "@/lib/types"
import { 
  CalendarDays, 
  CheckCircle2, 
  Clock, 
  Plus, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  Users,
  Target
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

function DashboardPage() {
  const [currentView, setCurrentView] = React.useState<CalendarViewType>('month')
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [showEventForm, setShowEventForm] = React.useState(false)
  const [selectedEvent, setSelectedEvent] = React.useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null)

  // Hooks for data management
  const { calendars, loading: calendarsLoading } = useCalendars()
  const { 
    events, 
    loading: eventsLoading, 
    createEvent, 
    updateEvent, 
    deleteEvent, 
    completeTask,
    stats,
    upcomingEvents,
    overdueEvents
  } = useEvents({
    start_date: format(startOfMonth(currentDate), 'yyyy-MM-dd'),
    end_date: format(endOfMonth(currentDate), 'yyyy-MM-dd'),
    calendar_ids: calendars.map(c => c.id)
  })

  const activeCalendars = calendars.filter(c => c.status === 'active')

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventForm(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setShowEventForm(true)
  }

  const handleCreateEvent = (date: Date) => {
    setSelectedDate(date)
    setSelectedEvent(null)
    setShowEventForm(true)
  }

  const handleEventSubmit = async (eventData: CreateEventForm | UpdateEventForm) => {
    if ('id' in eventData) {
      // Update existing event
      await updateEvent(eventData)
    } else {
      // Create new event
      if (selectedDate) {
        eventData.start_time = format(selectedDate, "yyyy-MM-dd'T'HH:mm")
      }
      await createEvent(eventData)
    }
    
    setShowEventForm(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const handleEventCancel = () => {
    setShowEventForm(false)
    setSelectedEvent(null)
    setSelectedDate(null)
  }

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Events</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            This month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.completion_rate}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.upcoming}</div>
          <p className="text-xs text-muted-foreground">
            Next 7 days
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            Needs attention
          </p>
        </CardContent>
      </Card>
    </div>
  )

  const renderUpcomingEvents = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
        <CardDescription>
          Your next {upcomingEvents.length} events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingEvents.slice(0, 5).map((event) => (
            <div
              key={event.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => handleEventClick(event)}
            >
              <div className="flex-1">
                <div className="font-medium">{event.title}</div>
                <div className="text-sm text-gray-500">
                  {format(new Date(event.start_time), 'MMM d, h:mm a')}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{event.type}</Badge>
                <Badge 
                  variant="outline"
                  className={
                    event.priority === 'high' ? "border-red-200 text-red-700" :
                    event.priority === 'medium' ? "border-yellow-200 text-yellow-700" :
                    "border-green-200 text-green-700"
                  }
                >
                  {event.priority}
                </Badge>
              </div>
            </div>
          ))}
          
          {upcomingEvents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No upcoming events</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => handleCreateEvent(new Date())}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const renderOverdueEvents = () => {
    if (overdueEvents.length === 0) return null

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Overdue Events
          </CardTitle>
          <CardDescription>
            {overdueEvents.length} events need your attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {overdueEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 cursor-pointer"
                onClick={() => handleEventClick(event)}
              >
                <div className="flex-1">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm text-red-600">
                    Due {format(new Date(event.start_time), 'MMM d, h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.type === 'task' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation()
                        completeTask(event.id)
                      }}
                    >
                      Complete
                    </Button>
                  )}
                  <Badge variant="outline" className="border-red-200 text-red-700">
                    Overdue
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderCalendars = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          My Calendars
        </CardTitle>
        <CardDescription>
          {activeCalendars.length} active calendars
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activeCalendars.map((calendar) => (
            <div
              key={calendar.id}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: calendar.color }}
                />
                <div>
                  <div className="font-medium">{calendar.name}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {calendar.type}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {calendar.is_default && (
                  <Badge variant="secondary" size="sm">Default</Badge>
                )}
                <Badge variant="outline" size="sm">
                  {events.filter(e => e.calendar_id === calendar.id).length}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (calendarsLoading || eventsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to your scheduling dashboard
            </p>
          </div>
          <Button onClick={() => handleCreateEvent(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderQuickStats()}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {renderOverdueEvents()}
                {renderUpcomingEvents()}
              </div>
              <div>
                {renderCalendars()}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <CalendarView
              view={currentView}
              date={currentDate}
              events={events}
              calendars={calendars}
              onEventClick={handleEventClick}
              onDateClick={handleDateClick}
              onViewChange={setCurrentView}
              onDateChange={setCurrentDate}
              onCreateEvent={handleCreateEvent}
            />
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">All Events</h2>
              <Button onClick={() => handleCreateEvent(new Date())}>
                <Plus className="h-4 w-4 mr-2" />
                New Event
              </Button>
            </div>
            
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="outline">{event.type}</Badge>
                          <Badge 
                            variant="outline"
                            className={
                              event.priority === 'high' ? "border-red-200 text-red-700" :
                              event.priority === 'medium' ? "border-yellow-200 text-yellow-700" :
                              "border-green-200 text-green-700"
                            }
                          >
                            {event.priority}
                          </Badge>
                          <Badge 
                            variant={event.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              event.status === 'completed' ? "bg-green-100 text-green-800" :
                              event.status === 'in_progress' ? "bg-blue-100 text-blue-800" :
                              ""
                            }
                          >
                            {event.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        {event.description && (
                          <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                        )}
                        <p className="text-sm text-gray-500">
                          {format(new Date(event.start_time), 'MMM d, yyyy h:mm a')}
                          {event.end_time && ` - ${format(new Date(event.end_time), 'h:mm a')}`}
                        </p>
                        {event.location && (
                          <p className="text-sm text-gray-500 mt-1">📍 {event.location}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEventClick(event)}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {events.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-500 mb-4">
                      Get started by creating your first event.
                    </p>
                    <Button onClick={() => handleCreateEvent(new Date())}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Event Form Dialog */}
        <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedEvent ? 'Edit Event' : 'Create New Event'}
              </DialogTitle>
              <DialogDescription>
                {selectedEvent 
                  ? 'Modify the details of this event.' 
                  : 'Fill in the details to create a new event on your calendar.'
                }
              </DialogDescription>
            </DialogHeader>
            <EventForm
              event={selectedEvent}
              calendars={calendars}
              categories={[]} // TODO: Add categories support
              onSubmit={handleEventSubmit}
              onCancel={handleEventCancel}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default withAuth(DashboardPage)