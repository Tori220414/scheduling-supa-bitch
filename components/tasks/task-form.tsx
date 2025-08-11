"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Task, CreateTaskForm, UpdateTaskForm } from "@/lib/types"
import { CalendarIcon, X } from "lucide-react"

interface TaskFormProps {
  task?: Task | null
  onSubmit: (data: CreateTaskForm | UpdateTaskForm) => Promise<void>
  onCancel: () => void
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    priority: task?.priority || ("medium" as const),
    due_date: task?.due_date ? task.due_date.split("T")[0] : "",
    status: task?.status || ("todo" as const),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const submitData = {
        ...formData,
        due_date: formData.due_date || undefined,
      }

      if (task) {
        await onSubmit({ ...submitData, id: task.id } as UpdateTaskForm)
      } else {
        await onSubmit(submitData as CreateTaskForm)
      }
    } catch (error) {
      console.error("Failed to submit task:", error)
    } finally {
      setLoading(false)
    }
  }

  const priorityColors = {
    low: "text-green-600",
    medium: "text-yellow-600",
    high: "text-orange-600",
    urgent: "text-red-600",
  }

  const statusColors = {
    todo: "text-gray-600",
    "in-progress": "text-blue-600",
    completed: "text-green-600",
    cancelled: "text-red-600",
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{task ? "Edit Task" : "Create New Task"}</CardTitle>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: any) => setFormData((prev) => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <span className={priorityColors.low}>Low Priority</span>
                  </SelectItem>
                  <SelectItem value="medium">
                    <span className={priorityColors.medium}>Medium Priority</span>
                  </SelectItem>
                  <SelectItem value="high">
                    <span className={priorityColors.high}>High Priority</span>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <span className={priorityColors.urgent}>Urgent</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {task && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">
                      <span className={statusColors.todo}>To Do</span>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <span className={statusColors["in-progress"]}>In Progress</span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className={statusColors.completed}>Completed</span>
                    </SelectItem>
                    <SelectItem value="cancelled">
                      <span className={statusColors.cancelled}>Cancelled</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <div className="relative">
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData((prev) => ({ ...prev, due_date: e.target.value }))}
              />
              <CalendarIcon className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
