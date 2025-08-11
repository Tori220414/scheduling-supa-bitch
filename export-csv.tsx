"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useSchedulingStore } from "@/store/scheduling-store"
import { format } from "date-fns"

export function ExportCSV({}: { children?: never } = { children: undefined }) {
  const { bookings, services } = useSchedulingStore()

  function downloadCSV() {
    const header = ["Title", "Service", "Client Name", "Client Email", "Start", "End", "Duration (min)", "Notes"]
    const rows = bookings.map((b) => {
      const svc = services.find((s) => s.id === b.serviceId)
      const dur = Math.round((+new Date(b.end) - +new Date(b.start)) / 60000)
      return [
        safe(b.title),
        safe(svc?.name ?? ""),
        safe(b.clientName),
        safe(b.clientEmail),
        format(new Date(b.start), "yyyy-MM-dd HH:mm"),
        format(new Date(b.end), "yyyy-MM-dd HH:mm"),
        String(dur),
        safe(b.notes ?? ""),
      ]
    })
    const csv = [header, ...rows].map((r) => r.map(csvEscape).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "bookings.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Button variant="outline" onClick={downloadCSV} className="gap-2 bg-transparent" aria-label="Export CSV">
      <Download className="size-4" />
      {"Export CSV"}
    </Button>
  )
}

function csvEscape(v: string) {
  if (v.includes(",") || v.includes('"') || v.includes("\n")) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}
function safe(v?: string) {
  return (v ?? "").toString()
}
