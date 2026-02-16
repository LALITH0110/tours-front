import { NextResponse } from "next/server"
import { removeRegistration } from "../../../../database/queries"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const removed = await removeRegistration(id)
  if (!removed) return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  return NextResponse.json({ data: removed })
}
