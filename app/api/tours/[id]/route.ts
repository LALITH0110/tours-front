import { NextResponse } from "next/server"
import { getTour, updateTour, deleteTour } from "../../../../database/queries"

export async function GET(_request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  const tour = await getTour(id)
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  return NextResponse.json({ data: tour })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  const result = await deleteTour(id)
  if (!result) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  return NextResponse.json({ data: result })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  const body = await request.json().catch(() => ({}))
  const { name, startTime, endTime, capacity, paused, canceled, statusOverride } = body || {}
  try {
    const updated = await updateTour(id, {
      name,
      startTime,
      endTime,
      capacity: capacity !== undefined ? Number.parseInt(capacity, 10) : undefined,
      paused,
      canceled,
      statusOverride,
    })
    if (!updated) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
    return NextResponse.json({ data: updated })
  } catch (err) {
    const code = (err as Error & { code?: string }).code
    if (code === "INVALID_CAPACITY") {
      return NextResponse.json({ error: (err as Error).message }, { status: 400 })
    }
    return NextResponse.json({ error: (err as Error).message || "Unable to update tour" }, { status: 400 })
  }
}
