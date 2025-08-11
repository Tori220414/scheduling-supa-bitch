import { getSupabase } from "@/lib/supabase-client"
import type { Task, CreateTaskForm, UpdateTaskForm } from "@/lib/types"

export class TasksAPI {
  private supabase = getSupabase()

  async getTasks(filters?: {
    status?: Task["status"]
    priority?: Task["priority"]
    due_before?: string
    due_after?: string
  }): Promise<Task[]> {
    let query = this.supabase.from("tasks").select("*").order("created_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }
    if (filters?.priority) {
      query = query.eq("priority", filters.priority)
    }
    if (filters?.due_before) {
      query = query.lte("due_date", filters.due_before)
    }
    if (filters?.due_after) {
      query = query.gte("due_date", filters.due_after)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`)
    }

    return data || []
  }

  async getTask(id: string): Promise<Task | null> {
    const { data, error } = await this.supabase.from("tasks").select("*").eq("id", id).single()

    if (error) {
      if (error.code === "PGRST116") {
        return null // Task not found
      }
      throw new Error(`Failed to fetch task: ${error.message}`)
    }

    return data
  }

  async createTask(taskData: CreateTaskForm): Promise<Task> {
    const { data, error } = await this.supabase
      .from("tasks")
      .insert([
        {
          ...taskData,
          status: "todo",
        },
      ])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`)
    }

    return data
  }

  async updateTask(taskData: UpdateTaskForm): Promise<Task> {
    const updateData: any = { ...taskData }
    delete updateData.id

    // Set completed_at when marking as completed
    if (taskData.status === "completed") {
      updateData.completed_at = new Date().toISOString()
    } else if (taskData.status !== "completed") {
      updateData.completed_at = null
    }

    const { data, error } = await this.supabase.from("tasks").update(updateData).eq("id", taskData.id).select().single()

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`)
    }

    return data
  }

  async deleteTask(id: string): Promise<void> {
    const { error } = await this.supabase.from("tasks").delete().eq("id", id)

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`)
    }
  }

  async completeTask(id: string): Promise<Task> {
    return this.updateTask({
      id,
      title: "", // Will be ignored in update
      priority: "medium", // Will be ignored in update
      status: "completed",
    })
  }

  async getTaskStats(): Promise<{
    total: number
    completed: number
    pending: number
    overdue: number
    completion_rate: number
  }> {
    const tasks = await this.getTasks()
    const now = new Date().toISOString()

    const total = tasks.length
    const completed = tasks.filter((t) => t.status === "completed").length
    const pending = tasks.filter((t) => t.status !== "completed").length
    const overdue = tasks.filter((t) => t.status !== "completed" && t.due_date && t.due_date < now).length

    const completion_rate = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      total,
      completed,
      pending,
      overdue,
      completion_rate,
    }
  }

  async getUpcomingTasks(days = 7): Promise<Task[]> {
    const now = new Date()
    const future = new Date()
    future.setDate(now.getDate() + days)

    return this.getTasks({
      due_after: now.toISOString(),
      due_before: future.toISOString(),
    })
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date().toISOString()

    return this.getTasks({
      due_before: now,
    }).then((tasks) => tasks.filter((t) => t.status !== "completed"))
  }
}

// Export singleton instance
export const tasksAPI = new TasksAPI()
