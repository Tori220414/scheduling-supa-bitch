"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { useSchedulingStore } from "@/store/scheduling-store"
import {
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
  isSameDay,
} from "date-fns"
import { cn } from "@/lib/utils"

export function CalendarMonth({}: { children?: never } = { children: undefined }) {
  const { bookings, setOpenBooking, setPendingDate, searchQuery } = useSchedulingStore()
  const [viewDate, setViewDate] = useState<Date>(new Date())

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
    const days = eachDayOfInterval({ start, end })
    const chunks: Date[][] = []
    for (let i = 0; i < days.length; i += 7) {
      chunks.push(days.slice(i, i + 7))
    }
    return chunks
  }, [viewDate])

  const filteredBookings = useMemo(() => {
    if (!searchQuery.trim()) return bookings
    const q = searchQuery.toLowerCase()
    return bookings.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q),
    )
  }, [bookings, searchQuery])

  const countForDay = (d: Date) => filteredBookings.filter((b) => isSameDay(new Date(b.start), d)).length

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewDate((d) => subMonths(d, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewDate((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="size-4" />
          </Button>
          <div className="font-medium">{format(viewDate, "MMMM yyyy")}</div>
        </div>
        <Button
          className="gap-2"
          onClick={() => {
            setPendingDate(new Date())
            setOpenBooking(true)
          }}
        >
          <Plus className="size-4" />
          {"Add booking"}
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-md overflow-hidden border bg-border">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="bg-muted py-2 text-center text-xs font-medium">
            {d}
          </div>
        ))}
        {weeks.map((week, wi) =>
          week.map((day) => {
            const inMonth = isSameMonth(day, viewDate)
            const isTodayFlag = isToday(day)
            const count = countForDay(day)
            return (
              <button
                key={`${wi}-${day.toISOString()}`}
                onClick={() => {
                  setPendingDate(day)
                  setOpenBooking(true)
                }}
                className={cn(
                  "aspect-square p-2 text-left bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring relative",
                  !inMonth && "text-muted-foreground/50",
                  isTodayFlag && "ring-2 ring-primary",
                )}
                aria-label={`${format(day, "EEEE, MMM d")}. ${count} booking${count === 1 ? "" : "s"}. Click to add`}
              >
                <div className="text-xs">{format(day, "d")}</div>
                {count > 0 && (
                  <Badge variant="secondary" className="absolute bottom-2 left-2">
                    {count} {"event" + (count === 1 ? "" : "s")}
                  </Badge>
                )}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )
}
