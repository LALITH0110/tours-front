import { NextResponse } from "next/server"
import { removeRegistration } from "../../../../../database/queries"

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const removed = await removeRegistration(params.id)
  if (!removed) return NextResponse.json({ error: "Registration not found" }, { status: 404 })
  return NextResponse.json({ data: removed })
}
