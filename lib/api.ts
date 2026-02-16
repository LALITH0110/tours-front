export type TourStatus = "available" | "filling-fast" | "almost-full" | "full" | "paused" | "canceled"

export interface Tour {
  id: string
  name: string
  startTime: string
  endTime: string
  capacity: number
  registered: number
  checkedIn: number
  remaining: number
  paused?: boolean
  canceled?: boolean
  statusOverride?: "available" | "filling-fast"
  status: TourStatus
}

export interface Settings {
  maxTicketsPerStudent: number
  fillingFastThreshold: number
  announcement?: string
}

export interface Student {
  id: string
  name: string
  email: string
  studentId: string
}

export interface Registration {
  id: string
  studentId: string
  tourId: string
  tickets: number
  code: string
  checkedIn: boolean
  createdAt: string
  student?: Student
  tour?: Tour
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const message = body.error || res.statusText
    throw new Error(message)
  }
  const json = await res.json()
  return json.data as T
}

export const apiClient = {
  getSettings: () => api<Settings>("/settings"),
  updateSettings: (payload: Partial<Settings>) =>
    api<Settings>("/settings", { method: "PATCH", body: JSON.stringify(payload) }),
  listTours: () => api<Tour[]>("/tours"),
  getTour: (id: string) => api<Tour>(`/tours/${id}`),
  createTour: (payload: Pick<Tour, "name" | "startTime" | "endTime" | "capacity">) =>
    api<Tour>("/tours", { method: "POST", body: JSON.stringify(payload) }),
  updateTour: (
    id: string,
    payload: Partial<Pick<Tour, "name" | "startTime" | "endTime" | "capacity" | "paused" | "canceled">> & {
      statusOverride?: "available" | "filling-fast"
    },
  ) => api<Tour>(`/tours/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  overrideCapacity: (id: string, capacity: number) =>
    api<Tour>(`/tours/${id}/override-capacity`, { method: "POST", body: JSON.stringify({ capacity }) }),
  pauseTour: (id: string) => api<Tour>(`/tours/${id}/pause`, { method: "POST" }),
  resumeTour: (id: string) => api<Tour>(`/tours/${id}/resume`, { method: "POST" }),
  deleteTour: (id: string) => api<{ id: string }>(`/tours/${id}`, { method: "DELETE" }),
  cancelTour: (id: string) => api<Tour>(`/tours/${id}/cancel`, { method: "POST" }),
  uncancelTour: (id: string) => api<Tour>(`/tours/${id}/uncancel`, { method: "POST" }),
  searchStudents: (q: string) => api<Student[]>(`/students${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createStudent: (payload: Pick<Student, "name" | "email" | "studentId">) =>
    api<Student>("/students", { method: "POST", body: JSON.stringify(payload) }),
  listRegistrations: (tourId?: string) =>
    api<Registration[]>(`/registrations${tourId ? `?tourId=${encodeURIComponent(tourId)}` : ""}`),
  listRegistrationsByStudent: (studentId: string) =>
    api<Registration[]>(`/registrations?studentId=${encodeURIComponent(studentId)}`),
  createRegistration: (payload: {
    tourId: string
    name?: string
    studentId?: string
    student?: Pick<Student, "name" | "email" | "studentId">
  }) =>
    api<{ registration: Registration; tour: Tour }>("/registrations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  toggleCheckIn: (registrationId: string) =>
    api<Registration>(`/registrations/${registrationId}/checkin`, { method: "PATCH" }),
  deleteRegistration: (registrationId: string) =>
    api<Registration>(`/registrations/${registrationId}`, { method: "DELETE" }),
}
