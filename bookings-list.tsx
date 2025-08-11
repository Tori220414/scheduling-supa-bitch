"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Trash2 } from "lucide-react"
import { useSchedulingStore } from "@/store/scheduling-store"
import { format } from "date-fns"

export function BookingsList({ limit = 0 }: { limit?: number } = { limit: 0 }) {
  const { bookings, services, removeBooking, searchQuery } = useSchedulingStore()

  const data = useMemo(() => {
    const byDate = [...bookings].sort((a, b) => +new Date(a.start) - +new Date(b.start))
    const now = new Date()
    const upcoming = byDate.filter((b) => new Date(b.end) >= now)
    const list = limit ? upcoming.slice(0, limit) : byDate

    if (!searchQuery.trim()) return list
    const q = searchQuery.toLowerCase()
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.clientEmail.toLowerCase().includes(q),
    )
  }, [bookings, limit, searchQuery])

  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? "Service"

  if (!data.length) {
    return <div className="text-sm text-muted-foreground">{"No bookings to show."}</div>
  }

  return (
    <div className="space-y-4">
      {data.map((b) => (
        <div key={b.id} className="rounded-md border">
          <div className="p-4 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="font-medium truncate">{b.title}</div>
              <div className="text-sm text-muted-foreground truncate">
                {serviceName(b.serviceId)} {"• "}
                {format(new Date(b.start), "EEE, MMM d, p")} {" - "}
                {format(new Date(b.end), "p")}
              </div>
              <div className="mt-1 text-sm">
                <span className="font-medium">{b.clientName}</span>{" "}
                <span className="text-muted-foreground">{"<" + b.clientEmail + ">"}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {Math.round((+new Date(b.end) - +new Date(b.start)) / 60000)} {"min"}
              </Badge>
              <Button variant="ghost" size="icon" aria-label="Delete booking" onClick={() => removeBooking(b.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
          {b.notes?.trim() ? (
            <>
              <Separator />
              <div className="p-4 text-sm text-muted-foreground whitespace-pre-wrap">{b.notes}</div>
            </>
          ) : null}
        </div>
      ))}
    </div>
  )
}
