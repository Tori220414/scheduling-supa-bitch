// Adding all missing type definitions for complete type system
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  user_metadata?: {
    full_name?: string
    avatar_url?: string
  }
}

export interface AuthContextType {
  user: AuthUser | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: any) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: UserProfile
        Insert: Omit<UserProfile, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
      }
      events: {
        Row: Event
        Insert: Omit<Event, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Event, "id" | "created_at" | "updated_at">>
      }
      calendars: {
        Row: Calendar
        Insert: Omit<Calendar, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Calendar, "id" | "created_at" | "updated_at">>
      }
      notes: {
        Row: Note
        Insert: Omit<Note, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Note, "id" | "created_at" | "updated_at">>
      }
      goals: {
        Row: Goal
        Insert: Omit<Goal, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Goal, "id" | "created_at" | "updated_at">>
      }
      habits: {
        Row: Habit
        Insert: Omit<Habit, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Habit, "id" | "created_at" | "updated_at">>
      }
    }
  }
}

export interface Task {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type TaskPriority = "low" | "medium" | "high"
export type TaskStatus = "todo" | "in_progress" | "completed"

export interface CreateTaskForm {
  title: string
  description?: string
  priority: TaskPriority
  due_date?: string
}

export interface UpdateTaskForm extends Partial<CreateTaskForm> {
  id: string
  status?: TaskStatus
}

export interface Event {
  id: string
  user_id: string
  calendar_id: string | null
  title: string
  description: string | null
  start_time: string
  end_time: string
  location: string | null
  event_type: EventType
  priority: EventPriority
  is_all_day: boolean
  recurrence_rule: string | null
  created_at: string
  updated_at: string
}

export type EventType = "meeting" | "appointment" | "task" | "reminder" | "personal" | "work"
export type EventPriority = "low" | "medium" | "high" | "urgent"

export interface CreateEventForm {
  title: string
  description?: string
  start_time: string
  end_time: string
  location?: string
  event_type: EventType
  priority: EventPriority
  is_all_day?: boolean
  calendar_id?: string
}

export interface UpdateEventForm extends Partial<CreateEventForm> {
  id: string
}

export interface Calendar {
  id: string
  user_id: string
  name: string
  description: string | null
  color: string
  status: CalendarStatus
  is_default: boolean
  created_at: string
  updated_at: string
}

export type CalendarStatus = "active" | "archived"

export interface CreateCalendarForm {
  name: string
  description?: string
  color: string
  is_default?: boolean
}

export interface UpdateCalendarForm extends Partial<CreateCalendarForm> {
  id: string
  status?: CalendarStatus
}

export type CalendarView = "month" | "week" | "day" | "agenda"

export interface CalendarProps {
  events: Event[]
  calendars: Calendar[]
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  onEventClick: (event: Event) => void
  onDateClick: (date: Date) => void
  onEventCreate: (eventData: CreateEventForm) => Promise<void>
  onEventUpdate: (eventData: UpdateEventForm) => Promise<void>
  onEventDelete: (eventId: string) => Promise<void>
}

export interface EventFormProps {
  event?: Event
  calendars: Calendar[]
  onSubmit: (eventData: CreateEventForm | UpdateEventForm) => Promise<void>
  onClose: () => void
}

export interface EventFilters {
  calendar_ids: string[]
  event_types: EventType[]
  priorities: EventPriority[]
  date_range: {
    start: string
    end: string
  } | null
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  per_page: number
  total_pages: number
}

export type Theme = "light" | "dark" | "system"

export interface Note {
  id: string
  user_id: string
  title: string
  content: string | null
  tags: string[]
  is_favorite: boolean
  created_at: string
  updated_at: string
}

export interface CreateNoteForm {
  title: string
  content?: string
  tags?: string[]
  is_favorite?: boolean
}

export interface UpdateNoteForm extends Partial<CreateNoteForm> {
  id: string
}

export interface Goal {
  id: string
  user_id: string
  title: string
  description: string | null
  target_value: number
  current_value: number
  unit: string
  category: GoalCategory
  status: GoalStatus
  target_date: string | null
  created_at: string
  updated_at: string
}

export type GoalCategory = "professional" | "personal" | "health" | "learning" | "financial"
export type GoalStatus = "active" | "completed" | "paused" | "cancelled"

export interface CreateGoalForm {
  title: string
  description?: string
  target_value: number
  current_value?: number
  unit: string
  category: GoalCategory
  target_date?: string
}

export interface UpdateGoalForm extends Partial<CreateGoalForm> {
  id: string
  current_value?: number
  status?: GoalStatus
}

export interface Habit {
  id: string
  user_id: string
  name: string
  description: string | null
  frequency: HabitFrequency
  target_count: number
  current_streak: number
  best_streak: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export type HabitFrequency = "daily" | "weekly" | "monthly"

export interface HabitCompletion {
  id: string
  habit_id: string
  user_id: string
  completed_date: string
  count: number
  created_at: string
}

export interface CreateHabitForm {
  name: string
  description?: string
  frequency: HabitFrequency
  target_count?: number
}

export interface UpdateHabitForm extends Partial<CreateHabitForm> {
  id: string
  is_active?: boolean
}
