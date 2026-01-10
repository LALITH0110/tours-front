import { NextResponse } from "next/server"
import { cancelTour } from "../../../../../database/queries"

export async function POST(_request: Request, { params }: { params: Promise<{ id?: string }> }) {
  const { id } = await params
  if (!id) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  const updated = await cancelTour(id)
  if (!updated) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}
