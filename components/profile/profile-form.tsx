"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { UserProfile, Theme } from "@/lib/types"
import { User, Clock, Globe, Bell, Palette, Save, Loader2 } from "lucide-react"
import { toast } from "sonner"

const profileSchema = z.object({
  username: z.string().min(3).max(50).optional().or(z.literal("")),
  full_name: z.string().max(100).optional().or(z.literal("")),
  bio: z.string().max(500).optional().or(z.literal("")),
  timezone: z.string(),
  preferred_language: z.string(),
  date_format: z.string(),
  time_format: z.enum(["12h", "24h"]),
  work_hours_start: z.string().regex(/^\d{2}:\d{2}$/),
  work_hours_end: z.string().regex(/^\d{2}:\d{2}$/),
  work_days: z.array(z.number().min(1).max(7)),
  email_notifications: z.boolean(),
  push_notifications: z.boolean(),
  theme: z.enum(["light", "dark", "system"]),
})

type ProfileFormData = z.infer<typeof profileSchema>

const timezones = [
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "Europe/London", label: "London" },
  { value: "Europe/Paris", label: "Paris" },
  { value: "Asia/Tokyo", label: "Tokyo" },
  { value: "Asia/Shanghai", label: "Shanghai" },
  { value: "Australia/Sydney", label: "Sydney" },
]

const languages = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
]

const dateFormats = [
  { value: "MM/dd/yyyy", label: "MM/DD/YYYY" },
  { value: "dd/MM/yyyy", label: "DD/MM/YYYY" },
  { value: "yyyy-MM-dd", label: "YYYY-MM-DD" },
  { value: "MMM dd, yyyy", label: "MMM DD, YYYY" },
]

const weekDays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
]

export function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = React.useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.profile?.username || "",
      full_name: user?.profile?.full_name || "",
      bio: user?.profile?.bio || "",
      timezone: user?.profile?.timezone || "UTC",
      preferred_language: user?.profile?.preferred_language || "en",
      date_format: user?.profile?.date_format || "MM/dd/yyyy",
      time_format: user?.profile?.time_format as "12h" | "24h" || "12h",
      work_hours_start: user?.profile?.work_hours_start || "09:00",
      work_hours_end: user?.profile?.work_hours_end || "17:00",
      work_days: user?.profile?.work_days || [1, 2, 3, 4, 5],
      email_notifications: user?.profile?.email_notifications ?? true,
      push_notifications: user?.profile?.push_notifications ?? true,
      theme: user?.profile?.theme as Theme || "light",
    },
  })

  React.useEffect(() => {
    if (user?.profile) {
      form.reset({
        username: user.profile.username || "",
        full_name: user.profile.full_name || "",
        bio: user.profile.bio || "",
        timezone: user.profile.timezone,
        preferred_language: user.profile.preferred_language,
        date_format: user.profile.date_format,
        time_format: user.profile.time_format as "12h" | "24h",
        work_hours_start: user.profile.work_hours_start,
        work_hours_end: user.profile.work_hours_end,
        work_days: user.profile.work_days,
        email_notifications: user.profile.email_notifications,
        push_notifications: user.profile.push_notifications,
        theme: user.profile.theme as Theme,
      })
    }
  }, [user?.profile, form])

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true)
    try {
      const updateData: Partial<UserProfile> = {
        ...data,
        username: data.username || null,
        full_name: data.full_name || null,
        bio: data.bio || null,
      }

      await updateProfile(updateData)
      toast.success("Profile updated successfully")
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleWorkDay = (day: number) => {
    const currentDays = form.getValues("work_days")
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort()
    
    form.setValue("work_days", newDays)
  }

  if (!user) {
    return <div>Please sign in to view your profile.</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Settings
          </CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="Enter username"
                    {...form.register("username")}
                  />
                  {form.formState.errors.username && (
                    <p className="text-sm text-red-600">
                      {form.formState.errors.username.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    placeholder="Enter full name"
                    {...form.register("full_name")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  className="resize-none"
                  rows={3}
                  {...form.register("bio")}
                />
                <p className="text-sm text-gray-500">
                  {form.watch("bio")?.length || 0}/500 characters
                </p>
              </div>
            </div>

            {/* Localization */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Localization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={form.watch("timezone")}
                    onValueChange={(value) => form.setValue("timezone", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={form.watch("preferred_language")}
                    onValueChange={(value) => form.setValue("preferred_language", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={form.watch("date_format")}
                    onValueChange={(value) => form.setValue("date_format", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      {dateFormats.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Time Format</Label>
                  <Select
                    value={form.watch("time_format")}
                    onValueChange={(value) => form.setValue("time_format", value as "12h" | "24h")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                      <SelectItem value="24h">24 Hour</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Work Schedule */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Work Schedule
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="work_hours_start">Start Time</Label>
                  <Input
                    id="work_hours_start"
                    type="time"
                    {...form.register("work_hours_start")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="work_hours_end">End Time</Label>
                  <Input
                    id="work_hours_end"
                    type="time"
                    {...form.register("work_hours_end")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Work Days</Label>
                <div className="flex flex-wrap gap-2">
                  {weekDays.map((day) => (
                    <Badge
                      key={day.value}
                      variant={form.watch("work_days").includes(day.value) ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => toggleWorkDay(day.value)}
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  Click to select your working days
                </p>
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email_notifications">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    id="email_notifications"
                    checked={form.watch("email_notifications")}
                    onCheckedChange={(checked) => form.setValue("email_notifications", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push_notifications">Push Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive push notifications on your device
                    </p>
                  </div>
                  <Switch
                    id="push_notifications"
                    checked={form.watch("push_notifications")}
                    onCheckedChange={(checked) => form.setValue("push_notifications", checked)}
                  />
                </div>
              </div>
            </div>

            {/* Appearance */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </h3>
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select
                  value={form.watch("theme")}
                  onValueChange={(value) => form.setValue("theme", value as Theme)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button type="submit" disabled={isLoading} className="w-full md:w-auto">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
