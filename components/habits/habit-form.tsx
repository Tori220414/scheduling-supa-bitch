"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { Textarea } from "../ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { Plus, Zap } from "lucide-react"
import type { Habit, CreateHabitForm, UpdateHabitForm, HabitFrequency } from "../../lib/types"

interface HabitFormProps {
  habit?: Habit
  onSubmit: (habitData: CreateHabitForm | UpdateHabitForm) => Promise<void>
  trigger?: React.ReactNode
}

const HABIT_FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
]

export function HabitForm({ habit, onSubmit, trigger }: HabitFormProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: habit?.name || "",
    description: habit?.description || "",
    frequency: habit?.frequency || ("daily" as HabitFrequency),
    target_count: habit?.target_count || 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (habit) {
        await onSubmit({ ...formData, id: habit.id } as UpdateHabitForm)
      } else {
        await onSubmit(formData as CreateHabitForm)
      }

      setOpen(false)
      if (!habit) {
        setFormData({
          name: "",
          description: "",
          frequency: "daily",
          target_count: 1,
        })
      }
    } catch (error) {
      console.error("Failed to save habit:", error)
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button>
      <Plus className="h-4 w-4 mr-2" />
      Add Habit
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {habit ? "Edit Habit" : "Create New Habit"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Habit Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter habit name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe your habit"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select
                value={formData.frequency}
                onValueChange={(value: HabitFrequency) => setFormData((prev) => ({ ...prev, frequency: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_FREQUENCIES.map((frequency) => (
                    <SelectItem key={frequency.value} value={frequency.value}>
                      {frequency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="target_count">Target Count</Label>
              <Input
                id="target_count"
                type="number"
                min="1"
                value={formData.target_count}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, target_count: Number.parseInt(e.target.value) || 1 }))
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : habit ? "Update Habit" : "Create Habit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
