import { NextResponse } from "next/server"
import { toggleCheckIn } from "../../../../../database/queries"

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id?: string }> },
) {
  const { id } = await params
  const updated = await toggleCheckIn(id)
  if (!updated) return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}
