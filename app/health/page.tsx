"use client"

import * as React from "react"
import { TopNav } from "@/components/top-nav"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity } from "lucide-react"

type EchoResponse = { ok: boolean; timestamp: string; runtime: string }
type DBResponse = { ok: boolean; version?: string; error?: string }

export default function HealthPage() {
  const [echo, setEcho] = React.useState<EchoResponse | null>(null)
  const [db, setDb] = React.useState<DBResponse | null>(null)
  const [checking, setChecking] = React.useState(false)

  async function runChecks() {
    setChecking(true)
    try {
      const [echoRes, dbRes] = await Promise.all([
        fetch("/api/echo").then((r) => r.json() as Promise<EchoResponse>),
        fetch("/api/db-health").then((r) => r.json() as Promise<DBResponse>),
      ])
      setEcho(echoRes)
      setDb(dbRes)
    } finally {
      setChecking(false)
    }
  }

  React.useEffect(() => {
    runChecks()
  }, [])

  return (
    <main className="min-h-screen bg-white text-neutral-900">
      <TopNav />
      <div className="mx-auto max-w-5xl p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Health checks
            </CardTitle>
            <CardDescription>Server route and Postgres connectivity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Button onClick={runChecks} variant="outline" disabled={checking}>
                {checking ? "Checking..." : "Re-run checks"}
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 text-sm font-semibold">/api/echo</h3>
                <pre className="rounded bg-neutral-50 p-3 text-xs">{JSON.stringify(echo, null, 2)}</pre>
              </div>
              <div>
                <h3 className="mb-2 text-sm font-semibold">/api/db-health</h3>
                <pre className="rounded bg-neutral-50 p-3 text-xs">{JSON.stringify(db, null, 2)}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
