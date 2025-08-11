import { createClient } from "@supabase/supabase-js"
import type { Goal, CreateGoalForm, UpdateGoalForm, GoalCategory, GoalStatus } from "../types"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export class GoalsAPI {
  async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getGoal(id: string): Promise<Goal | null> {
    const { data, error } = await supabase.from("goals").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  async createGoal(userId: string, goalData: CreateGoalForm): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .insert({
        ...goalData,
        user_id: userId,
        current_value: goalData.current_value || 0,
        status: "active" as GoalStatus,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateGoal(goalData: UpdateGoalForm): Promise<Goal> {
    const { id, ...updates } = goalData
    const { data, error } = await supabase
      .from("goals")
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

  async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from("goals").delete().eq("id", id)

    if (error) throw error
  }

  async updateProgress(id: string, currentValue: number): Promise<Goal> {
    const { data, error } = await supabase
      .from("goals")
      .update({
        current_value: currentValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getGoalsByCategory(userId: string, category: GoalCategory): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("category", category)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  async getGoalsByStatus(userId: string, status: GoalStatus): Promise<Goal[]> {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", status)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const goalsAPI = new GoalsAPI()
