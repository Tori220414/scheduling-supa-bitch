"use client"

import { useState } from "react"
import { Input } from "../ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Card, CardContent } from "../ui/card"
import { Search, Filter, Zap, CheckCircle, Pause, Calendar } from "lucide-react"
import type { Habit, HabitFrequency } from "../../lib/types"
import { HabitForm } from "./habit-form"
import { HabitItem } from "./habit-item"

interface HabitListProps {
  habits: Habit[]
  onUpdateHabit: (habitData: any) => Promise<void>
  onDeleteHabit: (id: string) => Promise<void>
  onCompleteHabit: (habitId: string, date?: string, count?: number) => Promise<void>
  onUncompleteHabit: (habitId: string, date?: string) => Promise<void>
}

export function HabitList({
  habits,
  onUpdateHabit,
  onDeleteHabit,
  onCompleteHabit,
  onUncompleteHabit,
}: HabitListProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [frequencyFilter, setFrequencyFilter] = useState<HabitFrequency | "all">("all")
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all")

  const filteredHabits = habits.filter((habit) => {
    const matchesSearch =
      habit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      habit.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFrequency = frequencyFilter === "all" || habit.frequency === frequencyFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? habit.is_active : !habit.is_active)

    return matchesSearch && matchesFrequency && matchesStatus
  })

  const getHabitStats = () => {
    const active = habits.filter((h) => h.is_active).length
    const inactive = habits.filter((h) => !h.is_active).length
    const totalStreak = habits.reduce((sum, h) => sum + h.current_streak, 0)
    const bestStreak = Math.max(...habits.map((h) => h.best_streak), 0)

    return { active, inactive, totalStreak, bestStreak }
  }

  const stats = getHabitStats()

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Pause className="h-4 w-4 text-gray-500" />
              <div>
                <p className="text-sm text-muted-foreground">Inactive</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Streak</p>
                <p className="text-2xl font-bold">{stats.totalStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Best Streak</p>
                <p className="text-2xl font-bold">{stats.bestStreak}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Habits</h2>
          <p className="text-muted-foreground">Build and track your daily routines</p>
        </div>
        <HabitForm onSubmit={onUpdateHabit} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search habits..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={frequencyFilter} onValueChange={(value: HabitFrequency | "all") => setFrequencyFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Frequency" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Frequencies</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={(value: "active" | "inactive" | "all") => setStatusFilter(value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Habits Grid */}
      {filteredHabits.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No habits found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || frequencyFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your filters"
                : "Create your first habit to get started"}
            </p>
            {!searchTerm && frequencyFilter === "all" && statusFilter === "all" && (
              <HabitForm onSubmit={onUpdateHabit} />
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredHabits.map((habit) => (
            <HabitItem
              key={habit.id}
              habit={habit}
              onUpdate={onUpdateHabit}
              onDelete={onDeleteHabit}
              onComplete={onCompleteHabit}
              onUncomplete={onUncompleteHabit}
            />
          ))}
        </div>
      )}
    </div>
  )
}
