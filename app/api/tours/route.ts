import { NextResponse } from "next/server"
import { createTour, listTours } from "../../../../database/queries"

export async function GET() {
  return NextResponse.json({ data: listTours() })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { name, startTime, endTime, capacity } = body || {}
  if (!name || !startTime || !endTime) {
    return NextResponse.json({ error: "name, startTime, and endTime are required" }, { status: 400 })
  }
  const cap = Number.parseInt(capacity, 10)
  if (!Number.isFinite(cap) || cap < 1) {
    return NextResponse.json({ error: "capacity must be a positive integer" }, { status: 400 })
  }
  const created = createTour({ name, startTime, endTime, capacity: cap })
  return NextResponse.json({ data: created }, { status: 201 })
}
