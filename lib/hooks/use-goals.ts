"use client"

import { useState, useEffect } from "react"
import type { Goal, CreateGoalForm, UpdateGoalForm, GoalCategory, GoalStatus } from "../types"
import { goalsAPI } from "../api/goals"
import { useAuth } from "./use-auth"

export interface UseGoalsReturn {
  goals: Goal[]
  loading: boolean
  error: string | null
  createGoal: (goalData: CreateGoalForm) => Promise<Goal>
  updateGoal: (goalData: UpdateGoalForm) => Promise<Goal>
  deleteGoal: (id: string) => Promise<void>
  updateProgress: (id: string, currentValue: number) => Promise<Goal>
  getGoalsByCategory: (category: GoalCategory) => Goal[]
  getGoalsByStatus: (status: GoalStatus) => Goal[]
  refreshGoals: () => Promise<void>
}

export const useGoals = (): UseGoalsReturn => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchGoals = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const fetchedGoals = await goalsAPI.getGoals(user.id)
      setGoals(fetchedGoals)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch goals")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [user])

  const createGoal = async (goalData: CreateGoalForm): Promise<Goal> => {
    if (!user) throw new Error("User not authenticated")

    try {
      const newGoal = await goalsAPI.createGoal(user.id, goalData)
      setGoals((prev) => [newGoal, ...prev])
      return newGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateGoal = async (goalData: UpdateGoalForm): Promise<Goal> => {
    try {
      const updatedGoal = await goalsAPI.updateGoal(goalData)
      setGoals((prev) => prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)))
      return updatedGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteGoal = async (id: string): Promise<void> => {
    try {
      await goalsAPI.deleteGoal(id)
      setGoals((prev) => prev.filter((goal) => goal.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete goal"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateProgress = async (id: string, currentValue: number): Promise<Goal> => {
    try {
      const updatedGoal = await goalsAPI.updateProgress(id, currentValue)
      setGoals((prev) => prev.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)))
      return updatedGoal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update progress"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getGoalsByCategory = (category: GoalCategory): Goal[] => {
    return goals.filter((goal) => goal.category === category)
  }

  const getGoalsByStatus = (status: GoalStatus): Goal[] => {
    return goals.filter((goal) => goal.status === status)
  }

  const refreshGoals = async (): Promise<void> => {
    await fetchGoals()
  }

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    updateProgress,
    getGoalsByCategory,
    getGoalsByStatus,
    refreshGoals,
  }
}
