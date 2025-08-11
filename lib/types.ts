// Type definitions for SchedulingBitch application

export type Database = {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          timezone: string
          preferred_language: string
          date_format: string
          time_format: string
          work_hours_start: string
          work_hours_end: string
          work_days: number[]
          email_notifications: boolean
          push_notifications: boolean
          theme: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string
          preferred_language?: string
          date_format?: string
          time_format?: string
          work_hours_start?: string
          work_hours_end?: string
          work_days?: number[]
          email_notifications?: boolean
          push_notifications?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string
          preferred_language?: string
          date_format?: string
          time_format?: string
          work_hours_start?: string
          work_hours_end?: string
          work_days?: number[]
          email_notifications?: boolean
          push_notifications?: boolean
          theme?: string
          created_at?: string
          updated_at?: string
        }
      }
      calendars: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          type: 'personal' | 'work' | 'shared' | 'public'
          status: 'active' | 'archived' | 'disabled'
          owner_id: string
          is_default: boolean
          settings: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          type?: 'personal' | 'work' | 'shared' | 'public'
          status?: 'active' | 'archived' | 'disabled'
          owner_id: string
          is_default?: boolean
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          type?: 'personal' | 'work' | 'shared' | 'public'
          status?: 'active' | 'archived' | 'disabled'
          owner_id?: string
          is_default?: boolean
          settings?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string | null
          type: 'task' | 'appointment' | 'meeting' | 'reminder' | 'deadline' | 'milestone'
          status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          start_time: string
          end_time: string | null
          all_day: boolean
          timezone: string | null
          location: string | null
          meeting_url: string | null
          meeting_id: string | null
          meeting_password: string | null
          calendar_id: string
          category_id: string | null
          parent_event_id: string | null
          progress_percentage: number
          estimated_duration: string | null
          actual_duration: string | null
          completed_at: string | null
          created_by: string
          assigned_to: string[]
          tags: string[]
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          type?: 'task' | 'appointment' | 'meeting' | 'reminder' | 'deadline' | 'milestone'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          start_time: string
          end_time?: string | null
          all_day?: boolean
          timezone?: string | null
          location?: string | null
          meeting_url?: string | null
          meeting_id?: string | null
          meeting_password?: string | null
          calendar_id: string
          category_id?: string | null
          parent_event_id?: string | null
          progress_percentage?: number
          estimated_duration?: string | null
          actual_duration?: string | null
          completed_at?: string | null
          created_by: string
          assigned_to?: string[]
          tags?: string[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          type?: 'task' | 'appointment' | 'meeting' | 'reminder' | 'deadline' | 'milestone'
          status?: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          start_time?: string
          end_time?: string | null
          all_day?: boolean
          timezone?: string | null
          location?: string | null
          meeting_url?: string | null
          meeting_id?: string | null
          meeting_password?: string | null
          calendar_id?: string
          category_id?: string | null
          parent_event_id?: string | null
          progress_percentage?: number
          estimated_duration?: string | null
          actual_duration?: string | null
          completed_at?: string | null
          created_by?: string
          assigned_to?: string[]
          tags?: string[]
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string | null
          user_id: string
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string | null
          user_id: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string | null
          user_id?: string
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Application-specific types
export interface UserProfile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  timezone: string
  preferred_language: string
  date_format: string
  time_format: string
  work_hours_start: string
  work_hours_end: string
  work_days: number[]
  email_notifications: boolean
  push_notifications: boolean
  theme: string
  created_at: string
  updated_at: string
}

export interface Calendar {
  id: string
  name: string
  description: string | null
  color: string
  type: 'personal' | 'work' | 'shared' | 'public'
  status: 'active' | 'archived' | 'disabled'
  owner_id: string
  is_default: boolean
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description: string | null
  type: 'task' | 'appointment' | 'meeting' | 'reminder' | 'deadline' | 'milestone'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_time: string
  end_time: string | null
  all_day: boolean
  timezone: string | null
  location: string | null
  meeting_url: string | null
  meeting_id: string | null
  meeting_password: string | null
  calendar_id: string
  category_id: string | null
  parent_event_id: string | null
  progress_percentage: number
  estimated_duration: string | null
  actual_duration: string | null
  completed_at: string | null
  created_by: string
  assigned_to: string[]
  tags: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string | null
  color: string
  icon: string | null
  user_id: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export type EventType = Event['type']
export type EventStatus = Event['status']
export type EventPriority = Event['priority']
export type CalendarType = Calendar['type']
export type CalendarStatus = Calendar['status']

// Form types
export interface CreateEventForm {
  title: string
  description?: string
  type: EventType
  priority: EventPriority
  start_time: string
  end_time?: string
  all_day: boolean
  location?: string
  meeting_url?: string
  calendar_id: string
  category_id?: string
  tags: string[]
}

export interface UpdateEventForm extends Partial<CreateEventForm> {
  id: string
  status?: EventStatus
  progress_percentage?: number
}

export interface CreateCalendarForm {
  name: string
  description?: string
  color: string
  type: CalendarType
}

export interface UpdateCalendarForm extends Partial<CreateCalendarForm> {
  id: string
  status?: CalendarStatus
}

// API Response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  has_next: boolean
  has_prev: boolean
}

// Calendar view types
export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export interface CalendarViewSettings {
  view: CalendarView
  date: string
  show_weekends: boolean
  selected_calendars: string[]
}

// Dashboard types
export interface DashboardStats {
  total_tasks: number
  completed_tasks: number
  overdue_tasks: number
  upcoming_events: number
  completion_rate: number
  productive_time: string
}

export interface TaskSummary {
  today: Event[]
  overdue: Event[]
  upcoming: Event[]
  completed_today: Event[]
}

// Notification types
export interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  action_url?: string
  created_at: string
}

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Time zone types
export interface TimeZone {
  value: string
  label: string
  offset: string
}

// Recurring event types
export interface RecurrenceRule {
  pattern: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
  interval: number
  days_of_week?: number[]
  day_of_month?: number
  week_of_month?: number
  month_of_year?: number
  until_date?: string
  max_occurrences?: number
}

// Integration types
export interface Integration {
  id: string
  service_name: string
  service_account_id: string
  sync_enabled: boolean
  last_sync_at: string | null
  sync_status: 'active' | 'error' | 'disabled'
  settings: Record<string, any>
}

// Search and filter types
export interface EventFilters {
  calendar_ids?: string[]
  category_ids?: string[]
  types?: EventType[]
  statuses?: EventStatus[]
  priorities?: EventPriority[]
  start_date?: string
  end_date?: string
  search?: string
  tags?: string[]
}

export interface SearchResult<T> {
  items: T[]
  total: number
  query: string
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: Record<string, any>
}

// Auth context types
export interface AuthUser {
  id: string
  email: string
  profile?: UserProfile
}

export interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>
}

// Hook types
export interface UseEventsOptions {
  calendar_ids?: string[]
  start_date?: string
  end_date?: string
  filters?: EventFilters
}

export interface UseCalendarsOptions {
  include_shared?: boolean
  status?: CalendarStatus[]
}

// Component prop types
export interface CalendarProps {
  view: CalendarView
  date: Date
  events: Event[]
  calendars: Calendar[]
  onEventClick?: (event: Event) => void
  onDateClick?: (date: Date) => void
  onEventDrop?: (event: Event, newStart: Date, newEnd?: Date) => void
  onEventResize?: (event: Event, newStart: Date, newEnd: Date) => void
}

export interface EventFormProps {
  event?: Event
  calendars: Calendar[]
  categories: Category[]
  onSubmit: (event: CreateEventForm | UpdateEventForm) => Promise<void>
  onCancel: () => void
}

export interface TaskListProps {
  events: Event[]
  onEventUpdate: (event: UpdateEventForm) => Promise<void>
  onEventDelete: (id: string) => Promise<void>
  groupBy?: 'status' | 'priority' | 'category' | 'date'
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>