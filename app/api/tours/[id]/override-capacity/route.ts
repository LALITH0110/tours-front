import { NextResponse } from "next/server"
import { overrideCapacity } from "../../../../../database/queries"

export async function POST(request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const cap = Number.parseInt(body?.capacity, 10)
  if (!Number.isFinite(cap) || cap < 1) {
    return NextResponse.json({ error: "capacity must be a positive integer" }, { status: 400 })
  }
  try {
    const updated = await overrideCapacity(id, cap)
    if (!updated) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    const code = (err as Error & { code?: string }).code
    if (code === "INVALID_CAPACITY") {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: (err as Error).message || "Unable to override capacity" }, { status: 400 })
  }
}
