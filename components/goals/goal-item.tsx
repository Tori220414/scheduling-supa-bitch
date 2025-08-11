"use client"

import { useState } from "react"
import { Button } from "../ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Badge } from "../ui/badge"
import { Progress } from "../ui/progress"
import { Input } from "../ui/input"
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
import { MoreHorizontal, Edit, Trash2, Play, Pause, CheckCircle, X, Plus, Minus, Calendar, Target } from "lucide-react"
import type { Goal, GoalStatus } from "../../lib/types"
import { GoalForm } from "./goal-form"
import { format } from "date-fns"

interface GoalItemProps {
  goal: Goal
  onUpdate: (goalData: any) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdateProgress: (id: string, currentValue: number) => Promise<void>
}

const STATUS_CONFIG = {
  active: { color: "bg-blue-500", label: "Active", icon: Target },
  completed: { color: "bg-green-500", label: "Completed", icon: CheckCircle },
  paused: { color: "bg-yellow-500", label: "Paused", icon: Pause },
  cancelled: { color: "bg-red-500", label: "Cancelled", icon: X },
}

const CATEGORY_COLORS = {
  professional: "bg-blue-100 text-blue-800",
  personal: "bg-purple-100 text-purple-800",
  health: "bg-green-100 text-green-800",
  learning: "bg-orange-100 text-orange-800",
  financial: "bg-emerald-100 text-emerald-800",
}

export function GoalItem({ goal, onUpdate, onDelete, onUpdateProgress }: GoalItemProps) {
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false)
  const [progressValue, setProgressValue] = useState(goal.current_value)

  const progressPercentage = Math.min((goal.current_value / goal.target_value) * 100, 100)
  const isCompleted = goal.status === "completed" || progressPercentage >= 100
  const StatusIcon = STATUS_CONFIG[goal.status].icon

  const handleStatusChange = async (newStatus: GoalStatus) => {
    await onUpdate({
      id: goal.id,
      status: newStatus,
    })
  }

  const handleProgressUpdate = async (increment: number) => {
    const newValue = Math.max(0, Math.min(goal.target_value, goal.current_value + increment))
    await onUpdateProgress(goal.id, newValue)
  }

  const handleProgressSubmit = async () => {
    if (progressValue !== goal.current_value) {
      await onUpdateProgress(goal.id, progressValue)
    }
    setIsUpdatingProgress(false)
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy")
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{goal.title}</CardTitle>
            <div className="flex items-center gap-2 mb-2">
              <Badge className={CATEGORY_COLORS[goal.category]}>{goal.category}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3" />
                {STATUS_CONFIG[goal.status].label}
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
              <GoalForm
                goal={goal}
                onSubmit={onUpdate}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                }
              />

              {goal.status === "active" && (
                <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </DropdownMenuItem>
              )}

              {goal.status === "paused" && (
                <DropdownMenuItem onClick={() => handleStatusChange("active")}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </DropdownMenuItem>
              )}

              {goal.status !== "completed" && progressPercentage >= 100 && (
                <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Complete
                </DropdownMenuItem>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(goal.id)}>Delete</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {goal.description && <p className="text-sm text-muted-foreground">{goal.description}</p>}

        {/* Progress Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Progress</span>
            <span className="font-medium">
              {goal.current_value} / {goal.target_value} {goal.unit}
            </span>
          </div>

          <Progress value={progressPercentage} className="h-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{Math.round(progressPercentage)}% complete</span>
            {goal.target_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(goal.target_date)}
              </span>
            )}
          </div>
        </div>

        {/* Progress Update Controls */}
        {goal.status === "active" && (
          <div className="space-y-2">
            {isUpdatingProgress ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max={goal.target_value}
                  value={progressValue}
                  onChange={(e) => setProgressValue(Number.parseInt(e.target.value) || 0)}
                  className="flex-1"
                />
                <Button size="sm" onClick={handleProgressSubmit}>
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setProgressValue(goal.current_value)
                    setIsUpdatingProgress(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProgressUpdate(-1)}
                  disabled={goal.current_value <= 0}
                >
                  <Minus className="h-3 w-3" />
                </Button>

                <Button size="sm" variant="outline" onClick={() => setIsUpdatingProgress(true)} className="flex-1">
                  Update Progress
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleProgressUpdate(1)}
                  disabled={goal.current_value >= goal.target_value}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
