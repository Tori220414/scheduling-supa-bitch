"use client"

import { useState, useEffect } from "react"
import type { Habit, HabitCompletion, CreateHabitForm, UpdateHabitForm, HabitFrequency } from "../types"
import { habitsAPI } from "../api/habits"
import { useAuth } from "./use-auth"

export interface UseHabitsReturn {
  habits: Habit[]
  loading: boolean
  error: string | null
  createHabit: (habitData: CreateHabitForm) => Promise<Habit>
  updateHabit: (habitData: UpdateHabitForm) => Promise<Habit>
  deleteHabit: (id: string) => Promise<void>
  completeHabit: (habitId: string, date?: string, count?: number) => Promise<HabitCompletion>
  uncompleteHabit: (habitId: string, date?: string) => Promise<void>
  getHabitCompletions: (habitId: string, startDate?: string, endDate?: string) => Promise<HabitCompletion[]>
  getHabitsByFrequency: (frequency: HabitFrequency) => Habit[]
  refreshHabits: () => Promise<void>
}

export const useHabits = (): UseHabitsReturn => {
  const [habits, setHabits] = useState<Habit[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchHabits = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)
      const fetchedHabits = await habitsAPI.getHabits(user.id)
      setHabits(fetchedHabits)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch habits")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHabits()
  }, [user])

  const createHabit = async (habitData: CreateHabitForm): Promise<Habit> => {
    if (!user) throw new Error("User not authenticated")

    try {
      const newHabit = await habitsAPI.createHabit(user.id, habitData)
      setHabits((prev) => [newHabit, ...prev])
      return newHabit
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create habit"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateHabit = async (habitData: UpdateHabitForm): Promise<Habit> => {
    try {
      const updatedHabit = await habitsAPI.updateHabit(habitData)
      setHabits((prev) => prev.map((habit) => (habit.id === updatedHabit.id ? updatedHabit : habit)))
      return updatedHabit
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update habit"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteHabit = async (id: string): Promise<void> => {
    try {
      await habitsAPI.deleteHabit(id)
      setHabits((prev) => prev.filter((habit) => habit.id !== id))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete habit"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const completeHabit = async (habitId: string, date?: string, count = 1): Promise<HabitCompletion> => {
    if (!user) throw new Error("User not authenticated")

    try {
      const completionDate = date || new Date().toISOString().split("T")[0]
      const completion = await habitsAPI.completeHabit(habitId, user.id, completionDate, count)

      // Refresh habits to get updated streaks
      await fetchHabits()

      return completion
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to complete habit"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const uncompleteHabit = async (habitId: string, date?: string): Promise<void> => {
    try {
      const completionDate = date || new Date().toISOString().split("T")[0]
      await habitsAPI.uncompleteHabit(habitId, completionDate)

      // Refresh habits to get updated streaks
      await fetchHabits()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to uncomplete habit"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getHabitCompletions = async (
    habitId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<HabitCompletion[]> => {
    try {
      return await habitsAPI.getHabitCompletions(habitId, startDate, endDate)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch habit completions"
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const getHabitsByFrequency = (frequency: HabitFrequency): Habit[] => {
    return habits.filter((habit) => habit.frequency === frequency && habit.is_active)
  }

  const refreshHabits = async (): Promise<void> => {
    await fetchHabits()
  }

  return {
    habits,
    loading,
    error,
    createHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    uncompleteHabit,
    getHabitCompletions,
    getHabitsByFrequency,
    refreshHabits,
  }
}
