import { NextResponse } from "next/server"
import { createStudent, searchStudents } from "../../../../database/queries"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const results = await searchStudents(q)
  return NextResponse.json({
    data: results.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      studentId: student.student_id,
    })),
  })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { name, email, studentId } = body || {}
  if (!name || !email || !studentId) {
    return NextResponse.json({ error: "name, email, and studentId are required" }, { status: 400 })
  }
  const student = await createStudent({ name, email, studentId })
  return NextResponse.json(
    { data: { id: student.id, name: student.name, email: student.email, studentId: student.student_id } },
    { status: 201 },
  )
}
