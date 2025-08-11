"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useSchedulingStore } from "@/store/scheduling-store"

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export function AvailabilityEditor({}: { children?: never } = { children: undefined }) {
  const { availability, setAvailabilityForDay } = useSchedulingStore()

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{"Weekly availability"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-sm text-muted-foreground">
          <div className="sm:col-span-4">{"Day"}</div>
          <div className="sm:col-span-2">{"Enabled"}</div>
          <div className="sm:col-span-3">{"Start"}</div>
          <div className="sm:col-span-3">{"End"}</div>
        </div>
        {WEEKDAYS.map((day, idx) => {
          const slot = availability[idx]
          return (
            <div key={day} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center rounded-md border p-3">
              <div className="sm:col-span-4 font-medium">{day}</div>
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={slot.enabled}
                    onCheckedChange={(v) => setAvailabilityForDay(idx, { enabled: v })}
                    aria-label={`Toggle ${day} availability`}
                  />
                  <span>{slot.enabled ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
              <div className="sm:col-span-3">
                <Label className="sr-only" htmlFor={`start-${idx}`}>
                  {"Start"}
                </Label>
                <Input
                  id={`start-${idx}`}
                  type="time"
                  value={slot.start}
                  onChange={(e) => setAvailabilityForDay(idx, { start: e.target.value })}
                  disabled={!slot.enabled}
                  step={300}
                />
              </div>
              <div className="sm:col-span-3">
                <Label className="sr-only" htmlFor={`end-${idx}`}>
                  {"End"}
                </Label>
                <Input
                  id={`end-${idx}`}
                  type="time"
                  value={slot.end}
                  onChange={(e) => setAvailabilityForDay(idx, { end: e.target.value })}
                  disabled={!slot.enabled}
                  step={300}
                />
              </div>
            </div>
          )
        })}
        <div className="text-xs text-muted-foreground">
          {"Note: Availability is used as guidance when creating bookings."}
        </div>
      </CardContent>
    </Card>
  )
}
