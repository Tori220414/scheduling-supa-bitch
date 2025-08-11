"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSchedulingStore } from "@/store/scheduling-store"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"

export function BookingDialog({}: { children?: never } = { children: undefined }) {
  const { openBooking, setOpenBooking, services, pendingDate, addBooking, availability } = useSchedulingStore()
  const { toast } = useToast()

  const defaultServiceId = services[0]?.id ?? ""
  const [serviceId, setServiceId] = useState<string>(defaultServiceId)
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [date, setDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState("09:00")
  const [notes, setNotes] = useState("")

  const selectedService = useMemo(() => services.find((s) => s.id === serviceId), [services, serviceId])

  // initialize on open
  useMemo(() => {
    if (openBooking) {
      const baseDate = pendingDate ?? new Date()
      setDate(baseDate)
      // set start time within availability if enabled
      const weekday = (baseDate.getDay() + 6) % 7 // 0=Mon ... 6=Sun
      const slot = availability[weekday]
      if (slot?.enabled) {
        setStartTime(slot.start)
      } else {
        setStartTime("09:00")
      }
      if (services.length && !serviceId) {
        setServiceId(services[0].id)
      }
    }
  }, [openBooking, pendingDate, availability, services, serviceId])

  function reset() {
    setServiceId(services[0]?.id ?? "")
    setClientName("")
    setClientEmail("")
    setNotes("")
  }

  function onSubmit() {
    if (!date) return
    if (!serviceId) {
      toast({ description: "Please select a service." })
      return
    }
    if (!clientName.trim()) {
      toast({ description: "Please enter a client name." })
      return
    }
    if (!clientEmail.trim() || !clientEmail.includes("@")) {
      toast({ description: "Please enter a valid email." })
      return
    }

    const [h, m] = startTime.split(":").map((n) => Number.parseInt(n, 10))
    const start = new Date(date)
    start.setHours(h, m, 0, 0)
    const duration = selectedService?.durationMin ?? 30
    const end = new Date(start.getTime() + duration * 60_000)

    addBooking({
      title: selectedService ? selectedService.name : "Booking",
      serviceId,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim(),
      start,
      end,
      notes,
    })
    setOpenBooking(false)
    reset()
    toast({ description: "Booking created." })
  }

  return (
    <Dialog open={openBooking} onOpenChange={setOpenBooking}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>{"New booking"}</DialogTitle>
          <DialogDescription>{"Create a new appointment."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="service">{"Service"}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="service" aria-label="Select service">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} {"•"} {s.durationMin} {"min"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="date">{"Date"}</Label>
              <Input
                id="date"
                type="date"
                value={date ? format(date, "yyyy-MM-dd") : ""}
                onChange={(e) => {
                  const parts = e.target.value.split("-").map((n) => Number.parseInt(n, 10))
                  if (parts.length === 3) {
                    const d = new Date(parts[0], parts[1] - 1, parts[2])
                    setDate(d)
                  }
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="time">{"Start time"}</Label>
              <Input
                id="time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                step={300}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">{"Client name"}</Label>
            <Input
              id="name"
              placeholder="Jane Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{"Client email"}</Label>
            <Input
              id="email"
              type="email"
              placeholder="jane@example.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">{"Notes"}</Label>
            <Textarea
              id="notes"
              placeholder="Optional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpenBooking(false)}>
            {"Cancel"}
          </Button>
          <Button onClick={onSubmit}>{"Create booking"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
