-- SchedulingBitch Database Schema
-- Comprehensive schema for scheduling, task management, and collaboration

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE,
    full_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferred_language VARCHAR(10) DEFAULT 'en',
    date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
    time_format VARCHAR(10) DEFAULT '12h',
    work_hours_start TIME DEFAULT '09:00',
    work_hours_end TIME DEFAULT '17:00',
    work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- Monday=1, Sunday=7
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    theme VARCHAR(20) DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles and permissions
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'user', 'guest');

CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    role user_role DEFAULT 'user',
    organization_id UUID, -- For future multi-tenant support
    granted_by UUID REFERENCES user_profiles(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, organization_id)
);

-- Categories for tasks and events
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1', -- Hex color
    icon VARCHAR(50), -- Icon name from icon library
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id)
);

-- Calendar/Schedule types
CREATE TYPE schedule_type AS ENUM ('personal', 'work', 'shared', 'public');
CREATE TYPE calendar_status AS ENUM ('active', 'archived', 'disabled');

CREATE TABLE IF NOT EXISTS calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    type schedule_type DEFAULT 'personal',
    status calendar_status DEFAULT 'active',
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}', -- Flexible settings storage
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar sharing and permissions
CREATE TYPE permission_level AS ENUM ('read', 'write', 'admin');

CREATE TABLE IF NOT EXISTS calendar_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    permission permission_level DEFAULT 'read',
    shared_by UUID NOT NULL REFERENCES user_profiles(id),
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    accepted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(calendar_id, user_id)
);

-- Event/Task types and priorities
CREATE TYPE event_type AS ENUM ('task', 'appointment', 'meeting', 'reminder', 'deadline', 'milestone');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');

-- Main events/tasks table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type event_type DEFAULT 'task',
    status task_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    
    -- Timing
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    
    -- Location and meeting details
    location TEXT,
    meeting_url TEXT,
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(50),
    
    -- Organization
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    parent_event_id UUID REFERENCES events(id), -- For sub-tasks
    
    -- Progress and completion
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_duration INTERVAL,
    actual_duration INTERVAL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Collaboration
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    assigned_to UUID[] DEFAULT ARRAY[]::UUID[], -- Array of user IDs
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}', -- Flexible data storage
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time)
);

-- Recurring events configuration
CREATE TYPE recurrence_pattern AS ENUM ('daily', 'weekly', 'monthly', 'yearly', 'custom');

CREATE TABLE IF NOT EXISTS recurring_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    pattern recurrence_pattern NOT NULL,
    interval_value INTEGER DEFAULT 1, -- Every N days/weeks/months/years
    days_of_week INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- For weekly: [1,3,5] = Mon,Wed,Fri
    day_of_month INTEGER, -- For monthly: 15th of every month
    week_of_month INTEGER, -- For monthly: 2nd week of every month
    month_of_year INTEGER, -- For yearly: January = 1
    
    -- Recurrence limits
    max_occurrences INTEGER,
    until_date TIMESTAMP WITH TIME ZONE,
    
    -- Exception handling
    exclude_dates TIMESTAMP WITH TIME ZONE[] DEFAULT ARRAY[]::TIMESTAMP WITH TIME ZONE[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id)
);

-- Generated recurring event instances
CREATE TABLE IF NOT EXISTS recurring_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recurring_event_id UUID NOT NULL REFERENCES recurring_events(id) ON DELETE CASCADE,
    original_event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    instance_date TIMESTAMP WITH TIME ZONE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    is_modified BOOLEAN DEFAULT false, -- If this instance was customized
    is_cancelled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(recurring_event_id, instance_date)
);

-- Event participants and attendees
CREATE TYPE attendance_status AS ENUM ('pending', 'accepted', 'declined', 'tentative');

CREATE TABLE IF NOT EXISTS event_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    email VARCHAR(255), -- For external participants
    name VARCHAR(100), -- For external participants
    status attendance_status DEFAULT 'pending',
    is_organizer BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT true,
    response_note TEXT,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT participant_identity CHECK (user_id IS NOT NULL OR email IS NOT NULL),
    UNIQUE(event_id, user_id),
    UNIQUE(event_id, email)
);

-- Notifications and reminders
CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms', 'in_app');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    status notification_status DEFAULT 'pending',
    
    -- Content
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    
    -- Timing
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Retry logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    error_message TEXT,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_notifications_scheduled ON notifications(scheduled_for, status),
    INDEX idx_notifications_user ON notifications(user_id, read_at)
);

-- Time tracking for tasks
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTERVAL GENERATED ALWAYS AS (end_time - start_time) STORED,
    description TEXT,
    billable BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_time_entry CHECK (end_time IS NULL OR end_time > start_time)
);

-- Comments and notes on events
CREATE TABLE IF NOT EXISTS event_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    reply_to_id UUID REFERENCES event_comments(id),
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_event_comments ON event_comments(event_id, created_at)
);

-- File attachments
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES event_comments(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES user_profiles(id),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_path TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT attachment_parent CHECK (event_id IS NOT NULL OR comment_id IS NOT NULL)
);

-- Activity logs for audit trail
CREATE TYPE activity_type AS ENUM ('created', 'updated', 'deleted', 'completed', 'shared', 'commented');

CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    calendar_id UUID REFERENCES calendars(id) ON DELETE CASCADE,
    activity_type activity_type NOT NULL,
    description TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    INDEX idx_activity_logs_user ON activity_logs(user_id, created_at),
    INDEX idx_activity_logs_event ON activity_logs(event_id, created_at)
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
    user_id UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
    calendar_view VARCHAR(20) DEFAULT 'month', -- month, week, day, agenda
    default_calendar_id UUID REFERENCES calendars(id),
    default_event_duration INTERVAL DEFAULT '1 hour',
    default_reminder_minutes INTEGER DEFAULT 15,
    auto_accept_invitations BOOLEAN DEFAULT false,
    show_weekends BOOLEAN DEFAULT true,
    start_week_on VARCHAR(10) DEFAULT 'monday', -- monday, sunday
    business_hours_enabled BOOLEAN DEFAULT true,
    custom_settings JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Integrations with external services
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- google, outlook, apple, etc.
    service_account_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'active', -- active, error, disabled
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, service_name)
);

-- Analytics and insights data
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Task completion metrics
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    tasks_overdue INTEGER DEFAULT 0,
    
    -- Time tracking metrics
    total_time_logged INTERVAL DEFAULT '0 minutes',
    productive_time INTERVAL DEFAULT '0 minutes',
    
    -- Calendar metrics
    meetings_attended INTEGER DEFAULT 0,
    events_created INTEGER DEFAULT 0,
    
    -- Efficiency metrics
    completion_rate DECIMAL(5,2) DEFAULT 0.00, -- Percentage
    average_task_duration INTERVAL,
    
    -- Raw data for detailed analysis
    detailed_metrics JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_calendar_time ON events(calendar_id, start_time);
CREATE INDEX IF NOT EXISTS idx_events_user_time ON events(created_by, start_time);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status, start_time);
CREATE INDEX IF NOT EXISTS idx_events_priority ON events(priority, start_time);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_recurring_instances_time ON recurring_instances(start_time);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_time ON time_entries(user_id, start_time);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that have updated_at columns
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendars_updated_at BEFORE UPDATE ON calendars FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recurring_events_updated_at BEFORE UPDATE ON recurring_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_comments_updated_at BEFORE UPDATE ON event_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_integrations_updated_at BEFORE UPDATE ON integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only see their own data)
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own categories" ON categories FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own calendars" ON calendars FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own calendars" ON calendars FOR ALL USING (auth.uid() = owner_id);

-- More complex policies for shared calendars and events will be added as needed
CREATE POLICY "Users can view shared calendars" ON calendars FOR SELECT USING (
    auth.uid() = owner_id OR 
    EXISTS (SELECT 1 FROM calendar_shares WHERE calendar_id = calendars.id AND user_id = auth.uid())
);

CREATE POLICY "Users can view accessible events" ON events FOR SELECT USING (
    auth.uid() = created_by OR 
    EXISTS (
        SELECT 1 FROM calendar_shares cs 
        JOIN calendars c ON c.id = cs.calendar_id 
        WHERE c.id = events.calendar_id AND cs.user_id = auth.uid()
    )
);

-- Function to create default data for new users
CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (id, full_name, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        LOWER(SPLIT_PART(NEW.email, '@', 1))
    );
    
    -- Create default calendar
    INSERT INTO calendars (name, owner_id, is_default)
    VALUES ('My Calendar', NEW.id, true);
    
    -- Create default categories
    INSERT INTO categories (name, color, user_id, is_default)
    VALUES 
        ('Work', '#3b82f6', NEW.id, true),
        ('Personal', '#10b981', NEW.id, true),
        ('Important', '#ef4444', NEW.id, true);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create defaults for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_defaults();

-- Function to generate recurring event instances
CREATE OR REPLACE FUNCTION generate_recurring_instances(
    recurring_event_uuid UUID,
    start_date DATE,
    end_date DATE
) RETURNS INTEGER AS $$
DECLARE
    rec_event recurring_events%ROWTYPE;
    base_event events%ROWTYPE;
    instance_count INTEGER := 0;
    current_date DATE;
    instance_start TIMESTAMP WITH TIME ZONE;
    instance_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get recurring event configuration
    SELECT * INTO rec_event FROM recurring_events WHERE id = recurring_event_uuid;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Get base event
    SELECT * INTO base_event FROM events WHERE id = rec_event.event_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    current_date := start_date;
    
    WHILE current_date <= end_date LOOP
        -- Calculate instance times
        instance_start := current_date + (base_event.start_time::TIME);
        instance_end := CASE 
            WHEN base_event.end_time IS NOT NULL 
            THEN current_date + (base_event.end_time::TIME)
            ELSE NULL 
        END;
        
        -- Check if we should create this instance based on recurrence pattern
        IF should_create_instance(rec_event, current_date) THEN
            -- Check if instance doesn't already exist and isn't excluded
            IF NOT EXISTS (
                SELECT 1 FROM recurring_instances 
                WHERE recurring_event_id = recurring_event_uuid 
                AND instance_date = current_date
            ) AND NOT (current_date = ANY(rec_event.exclude_dates::DATE[])) THEN
                
                INSERT INTO recurring_instances (
                    recurring_event_id,
                    original_event_id,
                    instance_date,
                    start_time,
                    end_time
                ) VALUES (
                    recurring_event_uuid,
                    rec_event.event_id,
                    current_date,
                    instance_start,
                    instance_end
                );
                
                instance_count := instance_count + 1;
            END IF;
        END IF;
        
        current_date := current_date + 1;
    END LOOP;
    
    RETURN instance_count;
END;
$$ LANGUAGE plpgsql;

-- Helper function for recurrence logic
CREATE OR REPLACE FUNCTION should_create_instance(
    rec_event recurring_events,
    check_date DATE
) RETURNS BOOLEAN AS $$
BEGIN
    CASE rec_event.pattern
        WHEN 'daily' THEN
            RETURN (check_date - rec_event.created_at::DATE) % rec_event.interval_value = 0;
        WHEN 'weekly' THEN
            RETURN EXTRACT(DOW FROM check_date) = ANY(rec_event.days_of_week) 
                AND (check_date - rec_event.created_at::DATE) / 7 % rec_event.interval_value = 0;
        WHEN 'monthly' THEN
            RETURN (rec_event.day_of_month IS NULL OR EXTRACT(DAY FROM check_date) = rec_event.day_of_month)
                AND EXTRACT(MONTH FROM AGE(check_date, rec_event.created_at::DATE)) % rec_event.interval_value = 0;
        WHEN 'yearly' THEN
            RETURN (rec_event.month_of_year IS NULL OR EXTRACT(MONTH FROM check_date) = rec_event.month_of_year)
                AND (rec_event.day_of_month IS NULL OR EXTRACT(DAY FROM check_date) = rec_event.day_of_month)
                AND EXTRACT(YEAR FROM AGE(check_date, rec_event.created_at::DATE)) % rec_event.interval_value = 0;
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql;