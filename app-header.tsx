"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CalendarDays, Settings } from "lucide-react"

export function AppHeader({}: { children?: never } = { children: undefined }) {
  return (
    <header className="border-b">
      <div className="container mx-auto h-14 px-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <CalendarDays className="size-5" aria-hidden="true" />
          <span className="font-semibold">{"Scheduling"}</span>
          <span className="sr-only">{"Home"}</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="icon" aria-label="Settings">
            <Settings className="size-4" />
          </Button>
        </nav>
      </div>
    </header>
  )
}
