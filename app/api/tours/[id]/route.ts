import { NextResponse } from "next/server"
import { getTour, updateTour } from "../../../../database/queries"

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const tour = await getTour(params.id)
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  return NextResponse.json({ data: tour })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}))
  const { name, startTime, endTime, capacity, paused, canceled } = body || {}
  try {
    const updated = updateTour(params.id, {
      name,
      startTime,
      endTime,
      capacity: capacity !== undefined ? Number.parseInt(capacity, 10) : undefined,
      paused,
      canceled,
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
