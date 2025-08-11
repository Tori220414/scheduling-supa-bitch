"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Plus, Target } from "lucide-react"
import type { Goal, CreateGoalForm, UpdateGoalForm, GoalCategory } from "../../lib/types"

interface GoalFormProps {
  goal?: Goal
  onSubmit: (goalData: CreateGoalForm | UpdateGoalForm) => Promise<void>
  trigger?: React.ReactNode
}

const GOAL_CATEGORIES: { value: GoalCategory; label: string }[] = [
  { value: "professional", label: "Professional" },
  { value: "personal", label: "Personal" },
  { value: "health", label: "Health" },
  { value: "learning", label: "Learning" },
  { value: "financial", label: "Financial" },
]

export function GoalForm({ goal, onSubmit, trigger }: GoalFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: goal?.title || "",
    description: goal?.description || "",
    target_value: goal?.target_value || 1,
    current_value: goal?.current_value || 0,
    unit: goal?.unit || "",
    category: goal?.category || ("personal" as GoalCategory),
    target_date: goal?.target_date ? goal.target_date.split("T")[0] : "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const goalData = {
        ...formData,
        target_date: formData.target_date || undefined,
      }

      if (goal) {
        await onSubmit({ ...goalData, id: goal.id } as UpdateGoalForm)
      } else {
        await onSubmit(goalData as CreateGoalForm)
      }

      setOpen(false)
      if (!goal) {
        setFormData({
          title: "",
          description: "",
          target_value: 1,
          current_value: 0,
          unit: "",
          category: "personal",
          target_date: "",
        })
      }
    } catch (error) {
      console.error("Failed to save goal:", error)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Goal
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {goal ? "Edit Goal" : "Create New Goal"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter goal title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your goal"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_value">Target Value</Label>
              <Input
                id="target_value"
                type="number"
                min="1"
                value={formData.target_value}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, target_value: Number.parseInt(e.target.value) || 1 }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData((prev) => ({ ...prev, unit: e.target.value }))}
                placeholder="e.g., books, pounds, hours"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value">Current Progress</Label>
            <Input
              id="current_value"
              type="number"
              min="0"
              max={formData.target_value}
              value={formData.current_value}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, current_value: Number.parseInt(e.target.value) || 0 }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value: GoalCategory) => setFormData((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GOAL_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_date">Target Date (Optional)</Label>
            <Input
              id="target_date"
              type="date"
              value={formData.target_date}
              onChange={(e) => setFormData((prev) => ({ ...prev, target_date: e.target.value }))}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : goal ? "Update Goal" : "Create Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
