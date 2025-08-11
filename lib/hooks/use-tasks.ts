"use client"

import { useState, useEffect } from "react"
import { tasksAPI } from "@/lib/api/tasks"
import type { Task, CreateTaskForm, UpdateTaskForm } from "@/lib/types"
import { toast } from "sonner"

interface UseTasksOptions {
  status?: Task["status"]
  priority?: Task["priority"]
  autoRefresh?: boolean
}

export function useTasks(options: UseTasksOptions = {}) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTasks = async () => {
    try {
      setLoading(true)
      setError(null)

      const filters: any = {}
      if (options.status) filters.status = options.status
      if (options.priority) filters.priority = options.priority

      const data = await tasksAPI.getTasks(filters)
      setTasks(data)
    } catch (err: any) {
      setError(err.message)
      toast.error("Failed to load tasks")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [options.status, options.priority])

  const createTask = async (taskData: CreateTaskForm) => {
    try {
      const newTask = await tasksAPI.createTask(taskData)
      setTasks((prev) => [newTask, ...prev])
      toast.success("Task created successfully")
      return newTask
    } catch (err: any) {
      toast.error("Failed to create task")
      throw err
    }
  }

  const updateTask = async (taskData: UpdateTaskForm) => {
    try {
      const updatedTask = await tasksAPI.updateTask(taskData)
      setTasks((prev) => prev.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
      toast.success("Task updated successfully")
      return updatedTask
    } catch (err: any) {
      toast.error("Failed to update task")
      throw err
    }
  }

  const deleteTask = async (id: string) => {
    try {
      await tasksAPI.deleteTask(id)
      setTasks((prev) => prev.filter((task) => task.id !== id))
      toast.success("Task deleted successfully")
    } catch (err: any) {
      toast.error("Failed to delete task")
      throw err
    }
  }

  const completeTask = async (id: string) => {
    try {
      const completedTask = await tasksAPI.completeTask(id)
      setTasks((prev) => prev.map((task) => (task.id === completedTask.id ? completedTask : task)))
      toast.success("Task completed!")
      return completedTask
    } catch (err: any) {
      toast.error("Failed to complete task")
      throw err
    }
  }

  const refresh = () => {
    fetchTasks()
  }

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    refresh,
  }
}

export function useTaskStats() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    overdue: 0,
    completion_rate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await tasksAPI.getTaskStats()
        setStats(data)
      } catch (err) {
        console.error("Failed to fetch task stats:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading }
}

export function useUpcomingTasks(days = 7) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksAPI.getUpcomingTasks(days)
        setTasks(data)
      } catch (err) {
        console.error("Failed to fetch upcoming tasks:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [days])

  return { tasks, loading }
}

export function useOverdueTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const data = await tasksAPI.getOverdueTasks()
        setTasks(data)
      } catch (err) {
        console.error("Failed to fetch overdue tasks:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return { tasks, loading }
}
