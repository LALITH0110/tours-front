import { NextResponse } from "next/server"
import { getSettings, updateSettings } from "../../../database/queries"

export async function GET() {
  const settings = await getSettings()
  return NextResponse.json({
    data: {
      maxTicketsPerStudent: settings.max_tours_per_student,
      fillingFastThreshold: settings.filling_fast_threshold,
      announcement: settings.announcement,
    },
  })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { maxTicketsPerStudent, fillingFastThreshold, announcement } = body || {}

  if (maxTicketsPerStudent !== undefined) {
    const max = Number.parseInt(maxTicketsPerStudent, 10)
    if (!Number.isFinite(max) || max < 1) {
      return NextResponse.json({ error: "maxTicketsPerStudent must be a positive integer" }, { status: 400 })
    }
  }
  if (fillingFastThreshold !== undefined) {
    const threshold = Number.parseFloat(fillingFastThreshold)
    if (!Number.isFinite(threshold) || threshold <= 0) {
      return NextResponse.json({ error: "fillingFastThreshold must be a positive number" }, { status: 400 })
    }
  }

  const updated = await updateSettings({
    maxToursPerStudent: maxTicketsPerStudent,
    fillingFastThreshold,
    announcement,
  })
  return NextResponse.json({
    data: {
      maxTicketsPerStudent: updated.max_tours_per_student,
      fillingFastThreshold: updated.filling_fast_threshold,
      announcement: updated.announcement,
    },
  })
}
