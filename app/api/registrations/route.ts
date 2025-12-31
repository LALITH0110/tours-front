import { NextResponse } from "next/server"
import { createRegistration, createStudent, listRegistrations } from "../../../database/queries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tourId = searchParams.get("tourId") || undefined
  const studentId = searchParams.get("studentId") || undefined
  const data = await listRegistrations({ tourId, studentId })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { tourId, studentId, student } = body || {}
  if (!tourId) return NextResponse.json({ error: "tourId is required" }, { status: 400 })

  let finalStudentId = studentId
  if (!finalStudentId) {
    if (!student || !student.name || !student.email || !student.studentId) {
      return NextResponse.json({ error: "studentId or student object is required" }, { status: 400 })
    }
    const created = await createStudent({
      name: student.name,
      email: student.email,
      studentId: student.studentId,
    })
    finalStudentId = created.id
  }

  try {
    const result = await createRegistration({ studentId: finalStudentId, tourId })
    return NextResponse.json(
      {
        data: {
          registration: {
            id: result.registrationId,
            studentId: finalStudentId,
            tourId,
            tickets: 1,
            code: result.code,
            checkedIn: false,
            createdAt: new Date().toISOString(),
          },
          tour: result.updatedTour,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    const code = (err as Error & { code?: string }).code
    if (code === "INSUFFICIENT_CAPACITY") {
      return NextResponse.json({ error: "Not enough capacity" }, { status: 409 })
    }
    if (code === "ALREADY_REGISTERED") {
      return NextResponse.json({ error: "Student already registered for this tour" }, { status: 409 })
    }
    if (code === "TOUR_LIMIT_REACHED") {
      return NextResponse.json({ error: "Student already registered for maximum tours" }, { status: 409 })
    }
    return NextResponse.json({ error: (err as Error).message || "Unable to create registration" }, { status: 400 })
  }
}
