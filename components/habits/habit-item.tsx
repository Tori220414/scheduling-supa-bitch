"use client"

import { useState, useEffect } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, CheckCircle, X, Flame, Calendar, Zap, Play, Pause } from "lucide-react"
import type { Habit } from "../../lib/types"
import { HabitForm } from "./habit-form"
import { habitsAPI } from "../../lib/api/habits"

interface HabitItemProps {
  habit: Habit
  onUpdate: (habitData: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onComplete: (habitId: string, date?: string, count?: number) => Promise<void>
  onUncomplete: (habitId: string, date?: string) => Promise<void>
}

const FREQUENCY_COLORS = {
  daily: "bg-blue-100 text-blue-800",
  weekly: "bg-green-100 text-green-800",
  monthly: "bg-purple-100 text-purple-800",
}

const FREQUENCY_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
}

export function HabitItem({ habit, onUpdate, onDelete, onComplete, onUncomplete }: HabitItemProps) {
  const [isCompletedToday, setIsCompletedToday] = useState(false)
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split("T")[0]

  useEffect(() => {
    checkTodayCompletion()
  }, [habit.id])

  const checkTodayCompletion = async () => {
    try {
      const completions = await habitsAPI.getHabitCompletions(habit.id, today, today)
      setIsCompletedToday(completions.length > 0)
    } catch (error) {
      console.error("Failed to check completion:", error)
    }
  }

  const handleToggleCompletion = async () => {
    setLoading(true)
    try {
      if (isCompletedToday) {
        await onUncomplete(habit.id, today)
        setIsCompletedToday(false)
      } else {
        await onComplete(habit.id, today, 1)
        setIsCompletedToday(true)
      }
    } catch (error) {
      console.error("Failed to toggle completion:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async () => {
    await onUpdate({
      id: habit.id,
      is_active: !habit.is_active,
    })
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{habit.name}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={FREQUENCY_COLORS[habit.frequency]}>{FREQUENCY_LABELS[habit.frequency]}</Badge>
              <Badge variant={habit.is_active ? "default" : "secondary"} className="flex items-center gap-1">
                {habit.is_active ? <Zap className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                {habit.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <HabitForm
                habit={habit}
                onSubmit={onUpdate}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                }
              />

              <DropdownMenuItem onClick={handleToggleActive}>
                {habit.is_active ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Habit</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{habit.name}"? This action cannot be undone and will remove all
                      completion history.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(habit.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {habit.description && <p className="text-sm text-muted-foreground">{habit.description}</p>}

        {/* Streak Information */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-xs text-muted-foreground">Current Streak</p>
              <p className="text-lg font-bold">{habit.current_streak}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Best Streak</p>
              <p className="text-lg font-bold">{habit.best_streak}</p>
            </div>
          </div>
        </div>

        {/* Target Information */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Target: {habit.target_count} time{habit.target_count !== 1 ? "s" : ""} per {habit.frequency.slice(0, -2)}
          </p>
        </div>

        {/* Completion Button */}
        {habit.is_active && (
          <Button
            onClick={handleToggleCompletion}
            disabled={loading}
            variant={isCompletedToday ? "default" : "outline"}
            className="w-full"
          >
            {loading ? (
              "Loading..."
            ) : isCompletedToday ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed Today
              </>
            ) : (
              <>
                <X className="h-4 w-4 mr-2" />
                Mark Complete
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
