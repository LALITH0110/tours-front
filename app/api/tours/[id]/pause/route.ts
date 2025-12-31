import { NextResponse } from "next/server"
import { pauseTour } from "../../../../../../database/queries"

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  const updated = await pauseTour(params.id)
  if (!updated) return NextResponse.json({ error: "Tour not found" }, { status: 404 })
  return NextResponse.json({ data: updated })
}
