import { NextResponse } from "next/server"
import { withClient } from "@/lib/db"

// Simple DB health check: runs "select version()"
export async function GET() {
  try {
    const version = await withClient(async (c) => {
      const res = await c.query<{ version: string }>("select version()")
      return res.rows[0]?.version
    })

    return NextResponse.json({ ok: true, version })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? "DB error" }, { status: 500 })
  }
}
