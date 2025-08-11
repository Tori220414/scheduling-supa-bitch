"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import { EventFormProps, CreateEventForm, UpdateEventForm, EventType, EventPriority } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Link, Tag, Users, Save, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z.string().max(1000, "Description is too long").optional(),
  type: z.enum(["task", "appointment", "meeting", "reminder", "deadline", "milestone"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().optional(),
  all_day: z.boolean(),
  location: z.string().max(200, "Location is too long").optional(),
  meeting_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  calendar_id: z.string().min(1, "Calendar is required"),
  category_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
})

type EventFormData = z.infer<typeof eventSchema>

const eventTypes: { value: EventType; label: string; icon: React.ReactNode }[] = [
  { value: "task", label: "Task", icon: <Calendar className="h-4 w-4" /> },
  { value: "appointment", label: "Appointment", icon: <Clock className="h-4 w-4" /> },
  { value: "meeting", label: "Meeting", icon: <Users className="h-4 w-4" /> },
  { value: "reminder", label: "Reminder", icon: <Calendar className="h-4 w-4" /> },
  { value: "deadline", label: "Deadline", icon: <Clock className="h-4 w-4" /> },
  { value: "milestone", label: "Milestone", icon: <Tag className="h-4 w-4" /> },
]

const priorities: { value: EventPriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-green-100 text-green-800 border-green-200" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  { value: "high", label: "High", color: "bg-orange-100 text-orange-800 border-orange-200" },
  { value: "urgent", label: "Urgent", color: "bg-red-100 text-red-800 border-red-200" },
]

export function EventForm({ event, calendars, categories, onSubmit, onCancel }: EventFormProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [newTag, setNewTag] = React.useState("")

  const isEditing = !!event

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: event?.title || "",
      description: event?.description || "",
      type: event?.type || "task",
      priority: event?.priority || "medium",
      start_time: event ? format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm") : "",
      end_time: event?.end_time ? format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm") : "",
      all_day: event?.all_day || false,
      location: event?.location || "",
      meeting_url: event?.meeting_url || "",
      calendar_id: event?.calendar_id || calendars[0]?.id || "",
      category_id: event?.category_id || "",
      tags: event?.tags || [],
    },
  })

  const watchAllDay = form.watch("all_day")
  const watchStartTime = form.watch("start_time")

  // Auto-set end time when start time changes
  React.useEffect(() => {
    if (watchStartTime && !watchAllDay && !form.getValues("end_time")) {
      const startDate = new Date(watchStartTime)
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000) // Add 1 hour
      form.setValue("end_time", format(endDate, "yyyy-MM-dd'T'HH:mm"))
    }
  }, [watchStartTime, watchAllDay, form])

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true)
    try {
      const submitData = isEditing
        ? ({ ...data, id: event.id } as UpdateEventForm)
        : (data as CreateEventForm)

      await onSubmit(submitData)
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to save event. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !form.getValues("tags").includes(newTag.trim())) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags")
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {isEditing ? "Edit Event" : "Create New Event"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Event title"
                  {...form.register("title")}
                  className={cn(form.formState.errors.title && "border-red-500")}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <Label>Type</Label>
                <Select
                  value={form.watch("type")}
                  onValueChange={(value) => form.setValue("type", value as EventType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Priority</Label>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(value) => form.setValue("priority", value as EventPriority)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <Badge className={priority.color} variant="outline">
                          {priority.label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Event description..."
                rows={3}
                {...form.register("description")}
              />
              <p className="text-sm text-gray-500 mt-1">
                {form.watch("description")?.length || 0}/1000 characters
              </p>
            </div>
          </div>

          <Separator />

          {/* Date & Time */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Date & Time
            </h3>

            <div className="flex items-center space-x-2">
              <Switch
                id="all_day"
                checked={form.watch("all_day")}
                onCheckedChange={(checked) => form.setValue("all_day", checked)}
              />
              <Label htmlFor="all_day">All day event</Label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">
                  Start {watchAllDay ? "Date" : "Date & Time"} *
                </Label>
                <Input
                  id="start_time"
                  type={watchAllDay ? "date" : "datetime-local"}
                  {...form.register("start_time")}
                  className={cn(form.formState.errors.start_time && "border-red-500")}
                />
                {form.formState.errors.start_time && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.start_time.message}
                  </p>
                )}
              </div>

              {!watchAllDay && (
                <div>
                  <Label htmlFor="end_time">End Date & Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    {...form.register("end_time")}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Location & Meeting */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Meeting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="Event location"
                  {...form.register("location")}
                />
              </div>

              <div>
                <Label htmlFor="meeting_url">Meeting URL</Label>
                <Input
                  id="meeting_url"
                  type="url"
                  placeholder="https://..."
                  {...form.register("meeting_url")}
                />
                {form.formState.errors.meeting_url && (
                  <p className="text-sm text-red-600 mt-1">
                    {form.formState.errors.meeting_url.message}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Organization */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Organization
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Calendar *</Label>
                <Select
                  value={form.watch("calendar_id")}
                  onValueChange={(value) => form.setValue("calendar_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select calendar" />
                  </SelectTrigger>
                  <SelectContent>
                    {calendars.map((calendar) => (
                      <SelectItem key={calendar.id} value={calendar.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded"
                            style={{ backgroundColor: calendar.color }}
                          />
                          {calendar.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {categories.length > 0 && (
                <div>
                  <Label>Category</Label>
                  <Select
                    value={form.watch("category_id")}
                    onValueChange={(value) => form.setValue("category_id", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                            {category.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {form.watch("tags").map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-red-100"
                    onClick={() => removeTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-6">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Event" : "Create Event"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
