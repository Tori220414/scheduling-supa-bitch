"use client"
import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { TopNav } from "@/components/top-nav"
import { TaskList } from "@/components/tasks/task-list"
import { CalendarView } from "@/components/calendar/calendar-view"
import { EventForm } from "@/components/events/event-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useTaskStats, useUpcomingTasks, useOverdueTasks } from "@/lib/hooks/use-tasks"
import { useEvents } from "@/lib/hooks/use-events"
import { useCalendars } from "@/lib/hooks/use-calendars"
import type { Event, CalendarView as CalendarViewType, CreateEventForm, UpdateEventForm } from "@/lib/types"
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Plus,
  AlertTriangle,
  BarChart3,
  Target,
  StickyNote,
  Zap,
} from "lucide-react"
import { format, startOfMonth, endOfMonth } from "date-fns"

export default function DashboardPage() {
  const { user, loading } = useAuth()

  // Calendar state
  const [currentView, setCurrentView] = useState<CalendarViewType>("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showEventForm, setShowEventForm] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Data hooks
  const { stats: taskStats, loading: statsLoading } = useTaskStats()
  const { tasks: upcomingTasks, loading: upcomingLoading } = useUpcomingTasks(7)
  const { tasks: overdueTasks, loading: overdueLoading } = useOverdueTasks()

  const { calendars, loading: calendarsLoading } = useCalendars()
  const {
    events,
    loading: eventsLoading,
    createEvent,
    updateEvent,
    deleteEvent,
    stats: eventStats,
  } = useEvents({
    start_date: format(startOfMonth(currentDate), "yyyy-MM-dd"),
    end_date: format(endOfMonth(currentDate), "yyyy-MM-dd"),
    calendar_ids: calendars.map((c) => c.id),
  })

  // Mock data for other features that aren't implemented yet
  const mockStats = {
    notes: { total: 15, recent: 5 },
    goals: { total: 4, active: 3, completed: 1 },
    habits: { total: 6, streak: 5, completed_today: 4 },
  }

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event)
    setShowEventForm(true)
  }

  const handleDateClick = (date: Date) => {
    setSelectedEvent(null)
    setCurrentDate(date)
    setShowEventForm(true)
  }

  const handleCreateEvent = (date?: Date) => {
    setSelectedEvent(null)
    if (date) setCurrentDate(date)
    setShowEventForm(true)
  }

  const handleEventSubmit = async (eventData: CreateEventForm | UpdateEventForm) => {
    if ("id" in eventData) {
      await updateEvent(eventData)
    } else {
      await createEvent(eventData)
    }
    setShowEventForm(false)
    setSelectedEvent(null)
  }

  const handleEventCancel = () => {
    setShowEventForm(false)
    setSelectedEvent(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav />
        <div className="container mx-auto py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to access your dashboard</h1>
            <Button onClick={() => (window.location.href = "/auth")}>Sign In</Button>
          </div>
        </div>
      </div>
    )
  }

  const renderQuickStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tasks</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statsLoading ? "..." : `${taskStats.completed}/${taskStats.total}`}</div>
          <p className="text-xs text-muted-foreground">
            {statsLoading ? "Loading..." : `${taskStats.pending} pending`}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Events</CardTitle>
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{eventsLoading ? "..." : eventStats.upcoming}</div>
          <p className="text-xs text-muted-foreground">{eventsLoading ? "Loading..." : `${eventStats.total} total`}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Notes</CardTitle>
          <StickyNote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{mockStats.notes.total}</div>
          <p className="text-xs text-muted-foreground">{mockStats.notes.recent} recent</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Goals</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mockStats.goals.active}/{mockStats.goals.total}
          </div>
          <p className="text-xs text-muted-foreground">{mockStats.goals.completed} completed</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Habits</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {mockStats.habits.completed_today}/{mockStats.habits.total}
          </div>
          <p className="text-xs text-muted-foreground">{mockStats.habits.streak} day streak</p>
        </CardContent>
      </Card>
    </div>
  )

  const renderRecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest updates and achievements</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!statsLoading && taskStats.completed > 0 && (
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="flex-1">
                <p className="font-medium">Completed {taskStats.completed} tasks</p>
                <p className="text-sm text-muted-foreground">{taskStats.completion_rate}% completion rate</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <StickyNote className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="font-medium">Notes feature coming soon</p>
              <p className="text-sm text-muted-foreground">Will be implemented next</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Zap className="h-5 w-5 text-purple-600" />
            <div className="flex-1">
              <p className="font-medium">Habits tracking coming soon</p>
              <p className="text-sm text-muted-foreground">Will be implemented next</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <Target className="h-5 w-5 text-orange-600" />
            <div className="flex-1">
              <p className="font-medium">Goals tracking coming soon</p>
              <p className="text-sm text-muted-foreground">Will be implemented next</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const renderQuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Get started with common tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
            <Plus className="h-5 w-5" />
            <span className="text-sm">New Task</span>
          </Button>

          <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
            <CalendarDays className="h-5 w-5" />
            <span className="text-sm">Schedule Event</span>
          </Button>

          <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
            <StickyNote className="h-5 w-5" />
            <span className="text-sm">Write Note</span>
          </Button>

          <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
            <Target className="h-5 w-5" />
            <span className="text-sm">Set Goal</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderUpcomingTasks = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Upcoming Tasks
        </CardTitle>
        <CardDescription>Tasks due in the next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {upcomingLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : upcomingTasks.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No upcoming tasks</div>
          ) : (
            upcomingTasks.slice(0, 3).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{task.title}</div>
                  <div className="text-sm text-muted-foreground">
                    Due {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "No due date"}
                  </div>
                </div>
                <Badge
                  variant={
                    task.priority === "urgent" ? "destructive" : task.priority === "high" ? "secondary" : "outline"
                  }
                >
                  {task.priority}
                </Badge>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.email}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
            <Button onClick={() => handleCreateEvent()}>
              <Plus className="h-4 w-4 mr-2" />
              Quick Add
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderQuickStats()}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {renderRecentActivity()}
                {renderUpcomingTasks()}
              </div>
              <div className="space-y-6">{renderQuickActions()}</div>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <TaskList />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            {calendarsLoading || eventsLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
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
            )}
          </TabsContent>

          <TabsContent value="notes" className="space-y-6">
            <div className="text-center py-12">
              <StickyNote className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Notes Management</h3>
              <p className="text-muted-foreground mb-4">Notes features will be implemented next</p>
              <Button variant="outline">Coming Soon</Button>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            <div className="text-center py-12">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Goals Tracking</h3>
              <p className="text-muted-foreground mb-4">Goal tracking features will be implemented next</p>
              <Button variant="outline">Coming Soon</Button>
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-6">
            <div className="text-center py-12">
              <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Habits System</h3>
              <p className="text-muted-foreground mb-4">Habit tracking features will be implemented next</p>
              <Button variant="outline">Coming Soon</Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* Event Form Dialog */}
        <Dialog open={showEventForm} onOpenChange={setShowEventForm}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
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
