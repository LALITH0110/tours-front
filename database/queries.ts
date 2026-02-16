import crypto from "node:crypto"
import { neon } from "@neondatabase/serverless"

const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not set")
}

const sql = neon(DATABASE_URL)

type TourStatus = "available" | "filling-fast" | "almost-full" | "full" | "paused" | "canceled"

interface TourRow {
  id: string
  name: string
  start_time: string
  end_time: string
  capacity: number
  registered: number
  checked_in: number
  status_override: string | null
  paused: boolean
  canceled: boolean
}

const computeStatus = (tour: TourRow, fillingFastThreshold: number): TourStatus => {
  if (tour.canceled) return "canceled"
  if (tour.paused) return "paused"
  const remaining = Math.max(tour.capacity - tour.registered, 0)
  if (remaining === 0) return "full"
  if (tour.status_override === "available") return "available"
  if (tour.status_override === "filling-fast") return "filling-fast"
  const percentRemaining = remaining / tour.capacity
  if (percentRemaining <= 0.1) return "almost-full"
  if (percentRemaining <= fillingFastThreshold) return "filling-fast"
  return "available"
}

export const getSettings = async () => {
  const rows = await sql<
    {
      max_tours_per_student: number
      filling_fast_threshold: number
      announcement: string
    }[]
  >`SELECT max_tours_per_student, filling_fast_threshold, announcement FROM settings WHERE id = 1`
  return rows[0]
}

export const updateSettings = async (payload: {
  maxToursPerStudent?: number
  fillingFastThreshold?: number
  announcement?: string
}) => {
  const { maxToursPerStudent, fillingFastThreshold, announcement } = payload
  const updated = await sql<
    {
      max_tours_per_student: number
      filling_fast_threshold: number
      announcement: string
    }[]
  >`
    UPDATE settings
    SET
      max_tours_per_student = COALESCE(${maxToursPerStudent}, max_tours_per_student),
      filling_fast_threshold = COALESCE(${fillingFastThreshold}, filling_fast_threshold),
      announcement = COALESCE(${announcement}, announcement)
    WHERE id = 1
    RETURNING max_tours_per_student, filling_fast_threshold, announcement
  `
  return updated[0]
}

export const listTours = async () => {
  const settings = await getSettings()
  const rows = await sql<TourRow[]>`
    SELECT id, name, start_time, end_time, capacity, registered, checked_in, status_override, paused, canceled
    FROM tours
    ORDER BY start_time ASC
  `
  return rows.map((tour) => {
    const remaining = Math.max(tour.capacity - tour.registered, 0)
    return {
      id: tour.id,
      name: tour.name,
      startTime: tour.start_time,
      endTime: tour.end_time,
      capacity: tour.capacity,
      registered: tour.registered,
      checkedIn: tour.checked_in,
      paused: tour.paused,
      canceled: tour.canceled,
      remaining,
      status: computeStatus(tour, settings.filling_fast_threshold),
    }
  })
}

export const getTour = async (id: string) => {
  const settings = await getSettings()
  const rows = await sql<TourRow[]>`
    SELECT id, name, start_time, end_time, capacity, registered, checked_in, status_override, paused, canceled
    FROM tours
    WHERE id = ${id}
  `
  const tour = rows[0]
  if (!tour) return null
  const remaining = Math.max(tour.capacity - tour.registered, 0)
  return {
    id: tour.id,
    name: tour.name,
    startTime: tour.start_time,
    endTime: tour.end_time,
    capacity: tour.capacity,
    registered: tour.registered,
    checkedIn: tour.checked_in,
    paused: tour.paused,
    canceled: tour.canceled,
    remaining,
    status: computeStatus(tour, settings.filling_fast_threshold),
  }
}

export const createTour = async (payload: { name: string; startTime: string; endTime: string; capacity: number }) => {
  const id = crypto.randomUUID()
  await sql`
    INSERT INTO tours (id, name, start_time, end_time, capacity, registered, checked_in, paused, canceled)
    VALUES (${id}, ${payload.name}, ${payload.startTime}, ${payload.endTime}, ${payload.capacity}, 0, 0, false, false)
  `
  return getTour(id)
}

export const updateTour = async (
  id: string,
  payload: Partial<{
    name: string
    startTime: string
    endTime: string
    capacity: number
    paused: boolean
    canceled: boolean
    statusOverride: "available" | "filling-fast"
  }>,
) => {
  if (payload.capacity !== undefined) {
    const existing = await sql<{ registered: number }[]>`SELECT registered FROM tours WHERE id = ${id}`
    if (!existing[0]) return null
    if (payload.capacity < existing[0].registered) {
      const error = new Error("Capacity cannot be lower than registered count")
      ;(error as Error & { code?: string }).code = "INVALID_CAPACITY"
      throw error
    }
  }

  const updated = await sql`
    UPDATE tours
    SET
      name = COALESCE(${payload.name}, name),
      start_time = COALESCE(${payload.startTime}, start_time),
      end_time = COALESCE(${payload.endTime}, end_time),
      capacity = COALESCE(${payload.capacity}, capacity),
      status_override = COALESCE(${payload.statusOverride}, status_override),
      paused = COALESCE(${payload.paused}, paused),
      canceled = COALESCE(${payload.canceled}, canceled),
      updated_at = NOW()
    WHERE id = ${id}
    RETURNING id
  `
  if (!updated[0]) return null
  return getTour(id)
}

export const overrideCapacity = async (id: string, capacity: number) => updateTour(id, { capacity })

export const pauseTour = async (id: string) => updateTour(id, { paused: true })

export const resumeTour = async (id: string) => updateTour(id, { paused: false })

export const cancelTour = async (id: string) => updateTour(id, { canceled: true, paused: true })

export const uncancelTour = async (id: string) => updateTour(id, { canceled: false, paused: false })

export const createWalkInRegistration = async (payload: { tourId: string; name: string }) => {
  const tourRows = await sql<TourRow[]>`
    SELECT id, name, start_time, end_time, capacity, registered, checked_in, paused, canceled, status_override
    FROM tours WHERE id = ${payload.tourId}
  `
  const tour = tourRows[0]
  if (!tour) throw new Error("Tour not found")
  if (tour.canceled) throw new Error("Tour is canceled")
  if (tour.paused) throw new Error("Tour is paused")
  const remaining = tour.capacity - tour.registered
  if (remaining < 1) {
    const error = new Error("Not enough capacity")
    ;(error as Error & { code?: string }).code = "INSUFFICIENT_CAPACITY"
    throw error
  }

  const studentId = crypto.randomUUID()
  const fakeEmail = `${crypto.randomUUID()}@walkin.local`
  await sql`
    INSERT INTO students (id, name, email, student_id)
    VALUES (${studentId}, ${payload.name}, ${fakeEmail}, ${studentId})
  `

  const registrationId = crypto.randomUUID()
  const code = crypto.randomUUID().slice(0, 5).toUpperCase()
  const now = new Date().toISOString()
  await sql`
    INSERT INTO registrations (id, student_id, tour_id, code, checked_in, created_at)
    VALUES (${registrationId}, ${studentId}, ${payload.tourId}, ${code}, false, ${now})
  `
  await sql`
    UPDATE tours SET registered = registered + 1, updated_at = NOW()
    WHERE id = ${payload.tourId}
  `

  const updatedTour = await getTour(payload.tourId)
  return { registrationId, code, studentId, updatedTour }
}

export const deleteTour = async (id: string) => {
  const existing = await sql<{ id: string }[]>`SELECT id FROM tours WHERE id = ${id}`
  if (!existing[0]) return null
  await sql`DELETE FROM registrations WHERE tour_id = ${id}`
  await sql`DELETE FROM tours WHERE id = ${id}`
  return { id }
}

export const searchStudents = async (query: string) => {
  if (!query) return []
  const q = `%${query.toLowerCase()}%`
  return sql<
    {
      id: string
      name: string
      email: string
      student_id: string
    }[]
  >`
    SELECT id, name, email, student_id
    FROM students
    WHERE LOWER(name) LIKE ${q} OR LOWER(email) LIKE ${q} OR LOWER(student_id) LIKE ${q}
    ORDER BY name ASC
    LIMIT 25
  `
}

export const createStudent = async (payload: { name: string; email: string; studentId: string }) => {
  const id = crypto.randomUUID()
  const rows = await sql<
    {
      id: string
      name: string
      email: string
      student_id: string
    }[]
  >`
    INSERT INTO students (id, name, email, student_id)
    VALUES (${id}, ${payload.name}, ${payload.email}, ${payload.studentId})
    ON CONFLICT (email)
    DO UPDATE SET name = EXCLUDED.name, student_id = EXCLUDED.student_id, updated_at = NOW()
    RETURNING id, name, email, student_id
  `
  return rows[0]
}

export const listRegistrations = async (payload: { tourId?: string; studentId?: string }) => {
  const settings = await getSettings()
  const rows = await sql<
    {
      id: string
      student_id: string
      tour_id: string
      code: string
      checked_in: boolean
      created_at: string
      student_name: string
      student_email: string
      student_student_id: string
      tour_name: string
      tour_start_time: string
      tour_end_time: string
      tour_capacity: number
      tour_registered: number
      tour_checked_in: number
      tour_status_override: string | null
      tour_paused: boolean
      tour_canceled: boolean
    }[]
  >`
    SELECT
      r.id,
      r.student_id,
      r.tour_id,
      r.code,
      r.checked_in,
      r.created_at,
      s.name AS student_name,
      s.email AS student_email,
      s.student_id AS student_student_id,
      t.name AS tour_name,
      t.start_time AS tour_start_time,
      t.end_time AS tour_end_time,
      t.capacity AS tour_capacity,
      t.registered AS tour_registered,
      t.checked_in AS tour_checked_in,
      t.status_override AS tour_status_override,
      t.paused AS tour_paused,
      t.canceled AS tour_canceled
    FROM registrations r
    JOIN students s ON s.id = r.student_id
    JOIN tours t ON t.id = r.tour_id
    WHERE (${payload.tourId ?? null}::uuid IS NULL OR r.tour_id = ${payload.tourId})
      AND (${payload.studentId ?? null}::uuid IS NULL OR r.student_id = ${payload.studentId})
    ORDER BY r.created_at DESC
  `

  return rows.map((row) => {
    const tour: TourRow = {
      id: row.tour_id,
      name: row.tour_name,
      start_time: row.tour_start_time,
      end_time: row.tour_end_time,
      capacity: row.tour_capacity,
      registered: row.tour_registered,
      checked_in: row.tour_checked_in,
      status_override: row.tour_status_override,
      paused: row.tour_paused,
      canceled: row.tour_canceled,
    }
    const remaining = Math.max(tour.capacity - tour.registered, 0)
    return {
      id: row.id,
      studentId: row.student_id,
      tourId: row.tour_id,
      tickets: 1,
      code: row.code,
      checkedIn: row.checked_in,
      createdAt: row.created_at,
      student: {
        id: row.student_id,
        name: row.student_name,
        email: row.student_email,
        studentId: row.student_student_id,
      },
      tour: {
        id: tour.id,
        name: tour.name,
        startTime: tour.start_time,
        endTime: tour.end_time,
        capacity: tour.capacity,
        registered: tour.registered,
        checkedIn: tour.checked_in,
        paused: tour.paused,
        canceled: tour.canceled,
        remaining,
        status: computeStatus(tour, settings.filling_fast_threshold),
      },
    }
  })
}

export const createRegistration = async (payload: { tourId: string; studentId: string }) => {
  const settingsRows = await sql<{ max_tours_per_student: number }[]>`
    SELECT max_tours_per_student FROM settings WHERE id = 1
  `
  const limit = settingsRows[0]?.max_tours_per_student ?? 2

  const tourRows = await sql<TourRow[]>`
    SELECT id, name, start_time, end_time, capacity, registered, checked_in, paused, canceled
    FROM tours
    WHERE id = ${payload.tourId}
  `
  const tour = tourRows[0]
  if (!tour) throw new Error("Tour not found")
  if (tour.canceled) throw new Error("Tour is canceled")
  if (tour.paused) throw new Error("Tour is paused")

  const existing = await sql<{ id: string }[]>`
    SELECT id FROM registrations WHERE student_id = ${payload.studentId} AND tour_id = ${payload.tourId}
  `
  if (existing.length > 0) {
    const error = new Error("Student already registered for this tour")
    ;(error as Error & { code?: string }).code = "ALREADY_REGISTERED"
    throw error
  }

  const countRows = await sql<{ count: number }[]>`
    SELECT COUNT(DISTINCT tour_id) AS count FROM registrations WHERE student_id = ${payload.studentId}
  `
  if ((countRows[0]?.count ?? 0) >= limit) {
    const error = new Error("Student already registered for maximum tours")
    ;(error as Error & { code?: string }).code = "TOUR_LIMIT_REACHED"
    throw error
  }

  const remaining = tour.capacity - tour.registered
  if (remaining < 1) {
    const error = new Error("Not enough capacity")
    ;(error as Error & { code?: string }).code = "INSUFFICIENT_CAPACITY"
    throw error
  }

  const registrationId = crypto.randomUUID()
  const code = crypto.randomUUID().slice(0, 5).toUpperCase()
  const now = new Date().toISOString()
  await sql`
    INSERT INTO registrations (id, student_id, tour_id, code, checked_in, created_at)
    VALUES (${registrationId}, ${payload.studentId}, ${payload.tourId}, ${code}, false, ${now})
  `
  await sql`
    UPDATE tours SET registered = registered + 1, updated_at = NOW() WHERE id = ${payload.tourId}
  `

  const updatedTour = await getTour(payload.tourId)
  return { registrationId, code, updatedTour }
}

export const toggleCheckIn = async (registrationIdOrCode?: string) => {
  const normalized = registrationIdOrCode?.trim() ?? ""
  if (!normalized) return null
  const rows = await sql<{ id: string; tour_id: string; checked_in: boolean }[]>`
    SELECT id, tour_id, checked_in
    FROM registrations
    WHERE id = ${normalized}
       OR LOWER(code) = LOWER(${normalized})
  `
  const reg = rows[0]
  if (!reg) return null
  const newCheckedIn = !reg.checked_in
  await sql`UPDATE registrations SET checked_in = ${newCheckedIn} WHERE id = ${reg.id}`
  await sql`
    UPDATE tours
    SET checked_in = checked_in + ${newCheckedIn ? 1 : -1}, updated_at = NOW()
    WHERE id = ${reg.tour_id}
  `
  return { id: reg.id, checkedIn: newCheckedIn }
}

export const removeRegistration = async (registrationId: string) => {
  const rows = await sql<{ id: string; tour_id: string; checked_in: boolean }[]>`
    SELECT id, tour_id, checked_in FROM registrations WHERE id = ${registrationId}
  `
  const reg = rows[0]
  if (!reg) return null
  await sql`DELETE FROM registrations WHERE id = ${registrationId}`
  await sql`
    UPDATE tours
    SET registered = GREATEST(registered - 1, 0),
        checked_in = GREATEST(checked_in - ${reg.checked_in ? 1 : 0}, 0),
        updated_at = NOW()
    WHERE id = ${reg.tour_id}
  `
  return reg
}
