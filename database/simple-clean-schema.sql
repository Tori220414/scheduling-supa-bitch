-- Simple Clean Schema - Start Fresh
-- This drops the problematic events table and recreates everything properly

-- Enable necessary extensions
SET statement_timeout = 0;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- ==================== CREATE ESSENTIAL TYPES ====================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE schedule_type AS ENUM ('personal', 'work', 'shared', 'public');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'calendar_status') THEN
        CREATE TYPE calendar_status AS ENUM ('active', 'archived', 'disabled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_type') THEN
        CREATE TYPE event_type AS ENUM ('task', 'appointment', 'meeting', 'reminder', 'deadline', 'milestone');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'priority_level') THEN
        CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled', 'on_hold');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'permission_level') THEN
        CREATE TYPE permission_level AS ENUM ('read', 'write', 'admin');
    END IF;
END
$$;

-- ==================== CLEAN SLATE - DROP PROBLEMATIC TABLES ====================
-- Drop events table to recreate with proper structure
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS events_backup CASCADE;

-- ==================== CREATE CORE TABLES ====================

-- User profiles should already exist, but ensure it's complete
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        CREATE TABLE user_profiles (
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
            work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
            email_notifications BOOLEAN DEFAULT true,
            push_notifications BOOLEAN DEFAULT true,
            theme VARCHAR(20) DEFAULT 'light',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END
$$;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    icon VARCHAR(50),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(name, user_id)
);

-- Calendars table  
CREATE TABLE IF NOT EXISTS calendars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#3b82f6',
    type schedule_type DEFAULT 'personal',
    status calendar_status DEFAULT 'active',
    owner_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    is_default BOOLEAN DEFAULT false,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Calendar shares
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

-- ==================== CREATE EVENTS TABLE WITH ALL REQUIRED COLUMNS ====================

CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    type event_type DEFAULT 'task',
    status task_status DEFAULT 'pending',
    priority priority_level DEFAULT 'medium',
    
    -- Timing - REQUIRED
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    
    -- Location and meeting details
    location TEXT,
    meeting_url TEXT,
    meeting_id VARCHAR(100),
    meeting_password VARCHAR(50),
    
    -- Organization - REQUIRED REFERENCES
    calendar_id UUID NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    parent_event_id UUID REFERENCES events(id),
    
    -- Progress and completion
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    estimated_duration INTERVAL,
    actual_duration INTERVAL,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Collaboration - REQUIRED
    created_by UUID NOT NULL REFERENCES user_profiles(id),
    assigned_to UUID[] DEFAULT ARRAY[]::UUID[],
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_time_range CHECK (end_time IS NULL OR end_time > start_time)
);

-- ==================== CREATE FUNCTIONS ====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION create_user_defaults()
RETURNS TRIGGER AS $$
BEGIN
    -- Create user profile
    INSERT INTO user_profiles (id, full_name, username)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        LOWER(SPLIT_PART(NEW.email, '@', 1))
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create default calendar
    INSERT INTO calendars (name, owner_id, is_default)
    VALUES ('My Calendar', NEW.id, true)
    ON CONFLICT DO NOTHING;
    
    -- Create default categories
    INSERT INTO categories (name, color, user_id, is_default)
    VALUES 
        ('Work', '#3b82f6', NEW.id, true),
        ('Personal', '#10b981', NEW.id, true),
        ('Important', '#ef4444', NEW.id, true)
    ON CONFLICT (name, user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================== CREATE TRIGGERS ====================
DO $$
BEGIN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- Create new trigger
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION create_user_defaults();
    
    -- Drop and recreate update triggers
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at 
        BEFORE UPDATE ON user_profiles 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
    CREATE TRIGGER update_categories_updated_at 
        BEFORE UPDATE ON categories 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_calendars_updated_at ON calendars;
    CREATE TRIGGER update_calendars_updated_at 
        BEFORE UPDATE ON calendars 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_events_updated_at ON events;
    CREATE TRIGGER update_events_updated_at 
        BEFORE UPDATE ON events 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
END
$$;

-- ==================== ENABLE ROW LEVEL SECURITY ====================
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ==================== CLEAN UP OLD POLICIES ====================
-- Drop any existing policies to avoid conflicts
DO $$
DECLARE
    pol_name TEXT;
BEGIN
    -- Drop all existing policies on events
    FOR pol_name IN (SELECT policyname FROM pg_policies WHERE tablename = 'events') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON events', pol_name);
    END LOOP;
    
    -- Drop existing policies on other tables if they conflict
    DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can manage own categories" ON categories;
    DROP POLICY IF EXISTS "Users can view own calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can manage own calendars" ON calendars;
    DROP POLICY IF EXISTS "Users can view relevant shares" ON calendar_shares;
    DROP POLICY IF EXISTS "Calendar owners can manage shares" ON calendar_shares;
END
$$;

-- ==================== CREATE RLS POLICIES ====================

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- Calendars policies  
CREATE POLICY "Users can view own calendars" ON calendars FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can manage own calendars" ON calendars FOR ALL USING (auth.uid() = owner_id);

-- Calendar shares policies
CREATE POLICY "Users can view relevant shares" ON calendar_shares FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = shared_by OR
    EXISTS (
        SELECT 1 FROM calendars c 
        WHERE c.id = calendar_id AND c.owner_id = auth.uid()
    )
);

CREATE POLICY "Calendar owners can manage shares" ON calendar_shares FOR ALL USING (
    EXISTS (
        SELECT 1 FROM calendars c 
        WHERE c.id = calendar_id AND c.owner_id = auth.uid()
    )
);

-- Events policies - NOW ALL COLUMNS EXIST
CREATE POLICY "Users can view accessible events" ON events FOR SELECT USING (
    auth.uid() = created_by OR 
    auth.uid() = ANY(assigned_to) OR
    EXISTS (
        SELECT 1 FROM calendars c
        WHERE c.id = calendar_id AND c.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can manage their events" ON events FOR ALL USING (
    auth.uid() = created_by OR
    EXISTS (
        SELECT 1 FROM calendars c 
        WHERE c.id = calendar_id AND c.owner_id = auth.uid()
    )
);

CREATE POLICY "Users can insert events" ON events FOR INSERT WITH CHECK (
    auth.uid() = created_by AND
    EXISTS (
        SELECT 1 FROM calendars c 
        WHERE c.id = calendar_id AND c.owner_id = auth.uid()
    )
);

-- ==================== CREATE INDEXES ====================
CREATE INDEX idx_events_calendar_time ON events(calendar_id, start_time);
CREATE INDEX idx_events_user_time ON events(created_by, start_time);
CREATE INDEX idx_events_status ON events(status, start_time);
CREATE INDEX idx_events_priority ON events(priority, start_time);
CREATE INDEX idx_events_tags ON events USING GIN(tags);
CREATE INDEX idx_events_assigned ON events USING GIN(assigned_to);

-- ==================== SUCCESS MESSAGE ====================
SELECT 'Clean schema created successfully! Events table now has all required columns and RLS policies are working.' AS result;