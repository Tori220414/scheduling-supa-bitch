import { Client } from "pg"

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.POSTGRES_URL,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  })

  try {
    await client.connect()
    console.log("Connected to database")

    // List of migration files in order
    const migrations = [
      "0001_create_user_profiles.sql",
      "0002_create_tasks.sql",
      "0003_create_events.sql",
      "0004_create_notes.sql",
      "0005_create_goals.sql",
      "0006_create_habits.sql",
    ]

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`)

      // Read the SQL file content (this would be the actual SQL content)
      let sql = ""

      if (migration === "0001_create_user_profiles.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.user_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            timezone TEXT DEFAULT 'UTC',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
          );
          ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id);
          CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      } else if (migration === "0002_create_tasks.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.tasks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'completed', 'cancelled')),
            priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
            due_date TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage own tasks" ON public.tasks FOR ALL USING (auth.uid() = user_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
          CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
          CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
        `
      } else if (migration === "0003_create_events.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            start_time TIMESTAMP WITH TIME ZONE NOT NULL,
            end_time TIMESTAMP WITH TIME ZONE NOT NULL,
            all_day BOOLEAN DEFAULT FALSE,
            location TEXT,
            color TEXT DEFAULT '#3b82f6',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage own events" ON public.events FOR ALL USING (auth.uid() = user_id);
          CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
          CREATE INDEX IF NOT EXISTS idx_events_start_time ON public.events(start_time);
          CREATE INDEX IF NOT EXISTS idx_events_end_time ON public.events(end_time);
        `
      } else if (migration === "0004_create_notes.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            content TEXT,
            tags TEXT[] DEFAULT '{}',
            is_favorite BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);
          CREATE INDEX IF NOT EXISTS idx_notes_user_id ON public.notes(user_id);
          CREATE INDEX IF NOT EXISTS idx_notes_tags ON public.notes USING GIN(tags);
          CREATE INDEX IF NOT EXISTS idx_notes_created_at ON public.notes(created_at DESC);
        `
      } else if (migration === "0005_create_goals.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.goals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            target_value NUMERIC,
            current_value NUMERIC DEFAULT 0,
            unit TEXT,
            category TEXT,
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
            target_date DATE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);
          CREATE INDEX IF NOT EXISTS idx_goals_user_id ON public.goals(user_id);
          CREATE INDEX IF NOT EXISTS idx_goals_status ON public.goals(status);
          CREATE INDEX IF NOT EXISTS idx_goals_target_date ON public.goals(target_date);
        `
      } else if (migration === "0006_create_habits.sql") {
        sql = `
          CREATE TABLE IF NOT EXISTS public.habits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
            target_count INTEGER DEFAULT 1,
            color TEXT DEFAULT '#10b981',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          CREATE TABLE IF NOT EXISTS public.habit_completions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            habit_id UUID REFERENCES public.habits(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            completed_date DATE NOT NULL,
            count INTEGER DEFAULT 1,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(habit_id, completed_date)
          );
          ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
          ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
          CREATE POLICY "Users can manage own habits" ON public.habits FOR ALL USING (auth.uid() = user_id);
          CREATE POLICY "Users can manage own habit completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id);
          CREATE INDEX IF NOT EXISTS idx_habits_user_id ON public.habits(user_id);
          CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_id ON public.habit_completions(habit_id);
          CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON public.habit_completions(completed_date);
        `
      }

      await client.query(sql)
      console.log(`✅ Migration ${migration} completed`)
    }

    console.log("All migrations completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    throw error
  } finally {
    await client.end()
  }
}

runMigrations().catch(console.error)
