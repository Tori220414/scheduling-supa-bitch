"use client"
import type { Task } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle, Clock, Edit, Trash2, AlertTriangle, Calendar } from "lucide-react"
import { format, isAfter, isBefore, isToday } from "date-fns"

interface TaskItemProps {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (id: string) => void
  onComplete: (id: string) => void
}

export function TaskItem({ task, onEdit, onDelete, onComplete }: TaskItemProps) {
  const isCompleted = task.status === "completed"
  const isOverdue = task.due_date && !isCompleted && isBefore(new Date(task.due_date), new Date())
  const isDueToday = task.due_date && isToday(new Date(task.due_date))
  const isDueSoon =
    task.due_date &&
    !isCompleted &&
    isAfter(new Date(task.due_date), new Date()) &&
    isBefore(new Date(task.due_date), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000))

  const priorityColors = {
    low: "border-green-200 text-green-700 bg-green-50",
    medium: "border-yellow-200 text-yellow-700 bg-yellow-50",
    high: "border-orange-200 text-orange-700 bg-orange-50",
    urgent: "border-red-200 text-red-700 bg-red-50",
  }

  const statusColors = {
    todo: "border-gray-200 text-gray-700 bg-gray-50",
    "in-progress": "border-blue-200 text-blue-700 bg-blue-50",
    completed: "border-green-200 text-green-700 bg-green-50",
    cancelled: "border-red-200 text-red-700 bg-red-50",
  }

  const handleToggleComplete = () => {
    if (!isCompleted) {
      onComplete(task.id)
    }
  }

  return (
    <Card
      className={`transition-all hover:shadow-md ${isCompleted ? "opacity-75" : ""} ${
        isOverdue ? "border-red-200 bg-red-50" : ""
      }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Completion Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6 mt-1"
            onClick={handleToggleComplete}
            disabled={isCompleted}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            )}
          </Button>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className={`font-medium ${isCompleted ? "line-through text-gray-500" : ""}`}>{task.title}</h3>
                {task.description && (
                  <p className={`text-sm mt-1 ${isCompleted ? "text-gray-400" : "text-gray-600"}`}>
                    {task.description}
                  </p>
                )}

                {/* Due Date */}
                {task.due_date && (
                  <div
                    className={`flex items-center gap-1 mt-2 text-sm ${
                      isOverdue
                        ? "text-red-600"
                        : isDueToday
                          ? "text-orange-600"
                          : isDueSoon
                            ? "text-yellow-600"
                            : "text-gray-500"
                    }`}
                  >
                    <Calendar className="h-4 w-4" />
                    <span>
                      Due {format(new Date(task.due_date), "MMM d, yyyy")}
                      {isOverdue && " (Overdue)"}
                      {isDueToday && " (Today)"}
                    </span>
                  </div>
                )}

                {/* Badges */}
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className={priorityColors[task.priority]}>
                    {task.priority}
                  </Badge>
                  <Badge variant="outline" className={statusColors[task.status]}>
                    {task.status.replace("-", " ")}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Overdue
                    </Badge>
                  )}
                  {isDueToday && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Due Today
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => onEdit(task)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(task.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
