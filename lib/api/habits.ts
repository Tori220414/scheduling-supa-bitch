import { createClient } from "@supabase/supabase-js"
import type { Habit, HabitCompletion, CreateHabitForm, UpdateHabitForm, HabitFrequency } from "../types"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export class HabitsAPI {
  async getHabits(userId: string): Promise<Habit[]> {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getHabit(id: string): Promise<Habit | null> {
    const { data, error } = await supabase.from("habits").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  async createHabit(userId: string, habitData: CreateHabitForm): Promise<Habit> {
    const { data, error } = await supabase
      .from("habits")
      .insert({
        ...habitData,
        user_id: userId,
        target_count: habitData.target_count || 1,
        current_streak: 0,
        best_streak: 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateHabit(habitData: UpdateHabitForm): Promise<Habit> {
    const { id, ...updates } = habitData
    const { data, error } = await supabase
      .from("habits")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async deleteHabit(id: string): Promise<void> {
    const { error } = await supabase.from("habits").delete().eq("id", id)

    if (error) throw error
  }

  async getHabitCompletions(habitId: string, startDate?: string, endDate?: string): Promise<HabitCompletion[]> {
    let query = supabase
      .from("habit_completions")
      .select("*")
      .eq("habit_id", habitId)
      .order("completed_date", { ascending: false })

    if (startDate) {
      query = query.gte("completed_date", startDate)
    }
    if (endDate) {
      query = query.lte("completed_date", endDate)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  async completeHabit(habitId: string, userId: string, date: string, count = 1): Promise<HabitCompletion> {
    // Check if already completed today
    const { data: existing } = await supabase
      .from("habit_completions")
      .select("*")
      .eq("habit_id", habitId)
      .eq("completed_date", date)
      .single()

    if (existing) {
      // Update existing completion
      const { data, error } = await supabase
        .from("habit_completions")
        .update({ count: existing.count + count })
        .eq("id", existing.id)
        .select()
        .single()

      if (error) throw error
      await this.updateStreaks(habitId)
      return data
    } else {
      // Create new completion
      const { data, error } = await supabase
        .from("habit_completions")
        .insert({
          habit_id: habitId,
          user_id: userId,
          completed_date: date,
          count,
        })
        .select()
        .single()

      if (error) throw error
      await this.updateStreaks(habitId)
      return data
    }
  }

  async uncompleteHabit(habitId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from("habit_completions")
      .delete()
      .eq("habit_id", habitId)
      .eq("completed_date", date)

    if (error) throw error
    await this.updateStreaks(habitId)
  }

  private async updateStreaks(habitId: string): Promise<void> {
    // Get habit and recent completions
    const { data: habit } = await supabase.from("habits").select("*").eq("id", habitId).single()
    if (!habit) return

    const { data: completions } = await supabase
      .from("habit_completions")
      .select("completed_date")
      .eq("habit_id", habitId)
      .order("completed_date", { ascending: false })

    if (!completions) return

    // Calculate current streak
    let currentStreak = 0
    const today = new Date().toISOString().split("T")[0]
    const completionDates = completions.map((c) => c.completed_date)

    // Check if completed today or yesterday to start streak
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0]

    if (completionDates.includes(today) || completionDates.includes(yesterday)) {
      let checkDate = completionDates.includes(today) ? today : yesterday

      while (completionDates.includes(checkDate)) {
        currentStreak++
        const date = new Date(checkDate)
        date.setDate(date.getDate() - 1)
        checkDate = date.toISOString().split("T")[0]
      }
    }

    // Calculate best streak
    let bestStreak = 0
    let tempStreak = 0
    const sortedDates = [...completionDates].sort()

    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prevDate = new Date(sortedDates[i - 1])
        const currDate = new Date(sortedDates[i])
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

        if (dayDiff === 1) {
          tempStreak++
        } else {
          bestStreak = Math.max(bestStreak, tempStreak)
          tempStreak = 1
        }
      }
    }
    bestStreak = Math.max(bestStreak, tempStreak)

    // Update habit with new streaks
    await supabase
      .from("habits")
      .update({
        current_streak: currentStreak,
        best_streak: Math.max(habit.best_streak, bestStreak),
        updated_at: new Date().toISOString(),
      })
      .eq("id", habitId)
  }

  async getHabitsByFrequency(userId: string, frequency: HabitFrequency): Promise<Habit[]> {
    const { data, error } = await supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .eq("frequency", frequency)
      .eq("is_active", true)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const habitsAPI = new HabitsAPI()
