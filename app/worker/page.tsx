"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Search, CheckCircle2, UserPlus } from "lucide-react"
import { apiClient, type Registration, type Student, type Tour } from "../../lib/api"

interface WalkIn {
  name: string
  email: string
  studentId: string
}

export default function WorkerPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedTour, setSelectedTour] = useState("")
  const [checkinTour, setCheckinTour] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Student[]>([])
  const [showResults, setShowResults] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [registrationCode, setRegistrationCode] = useState("")
  const [loadingTours, setLoadingTours] = useState(true)
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [searching, setSearching] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [walkInMode, setWalkInMode] = useState(false)
  const [walkIn, setWalkIn] = useState<WalkIn>({ name: "", email: "", studentId: "" })
  const [maxTickets, setMaxTickets] = useState(2)

  const selectedTourDetails = useMemo(() => tours.find((t) => t.id === selectedTour), [tours, selectedTour])
  const confirmationStudentName = selectedStudent?.name || (walkInMode ? walkIn.name : "")

  useEffect(() => {
    const loadInitial = async () => {
      await Promise.all([refreshSettings(), refreshTours()])
      await refreshRegistrations()
    }
    loadInitial()
  }, [])

  useEffect(() => {
    if (checkinTour) refreshRegistrations(checkinTour)
  }, [checkinTour])

  const refreshSettings = async () => {
    try {
      const settings = await apiClient.getSettings()
      setMaxTickets(settings.maxTicketsPerStudent || 2)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load settings")
    }
  }

  const refreshTours = async () => {
    setLoadingTours(true)
    try {
      const data = await apiClient.listTours()
      setTours(data)
      if (!selectedTour && data.length > 0) setSelectedTour(data[0].id)
      if (!checkinTour && data.length > 0) setCheckinTour(data[0].id)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tours")
    } finally {
      setLoadingTours(false)
    }
  }

  const refreshRegistrations = async (tourId?: string) => {
    setLoadingRegistrations(true)
    try {
      const data = await apiClient.listRegistrations(tourId || undefined)
      setRegistrations(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load registrations")
    } finally {
      setLoadingRegistrations(false)
    }
  }

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setShowResults(false)
      return
    }

    const timeout = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await apiClient.searchStudents(searchQuery.trim())
        setSearchResults(results)
        setShowResults(true)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed")
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [searchQuery])

  const handleRegister = async () => {
    setFormError(null)
    if (!selectedTour) {
      setFormError("Select a tour")
      return
    }

    let payload: {
      tourId: string
      tickets: number
      studentId?: string
      student?: WalkIn
    } = { tourId: selectedTour, tickets: ticketCount }

    if (selectedStudent) {
      payload = { ...payload, studentId: selectedStudent.id }
    } else if (walkInMode) {
      if (!walkIn.name || !walkIn.email || !walkIn.studentId) {
        setFormError("Enter name, email, and student ID")
        return
      }
      payload = { ...payload, student: walkIn }
    } else {
      setFormError("Select a student or use walk-in")
      return
    }

    setSubmitting(true)
    try {
      const { registration, tour } = await apiClient.createRegistration(payload)
      setRegistrationCode(registration.code)
      setShowConfirmation(true)
      setTours((prev) => prev.map((t) => (t.id === tour.id ? tour : t)))
      await refreshRegistrations(checkinTour || selectedTour)
      setSelectedStudent(payload.student ? { ...payload.student, id: registration.studentId } : selectedStudent)
      setWalkIn({ name: "", email: "", studentId: "" })
      setWalkInMode(false)
      setError(null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not complete registration")
    } finally {
      setSubmitting(false)
    }
  }

  const handleCheckIn = async (id: string) => {
    try {
      await apiClient.toggleCheckIn(id)
      await refreshTours()
      await refreshRegistrations(checkinTour)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update check-in")
    }
  }

  const resetForm = () => {
    setSearchQuery("")
    setSearchResults([])
    setShowResults(false)
    setSelectedStudent(null)
    setTicketCount(1)
    setShowConfirmation(false)
    setRegistrationCode("")
    setWalkInMode(false)
    setWalkIn({ name: "", email: "", studentId: "" })
  }

  const canSubmit =
    !!selectedTour && (selectedStudent !== null || (walkInMode && walkIn.name && walkIn.email && walkIn.studentId))

  const ticketOptions = Array.from({ length: maxTickets }, (_, i) => i + 1)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Illinois Tech</h1>
              <p className="text-sm text-muted-foreground">Worker Registration Portal</p>
            </div>
            <Link href="/">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="register" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-6">
            {!showConfirmation ? (
              <div className="max-w-3xl mx-auto space-y-6">
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center">
                    {error}
                  </div>
                )}
                <Card>
                  <CardHeader>
                    <CardTitle>Select a Tour</CardTitle>
                    <CardDescription>Tap a tour tile to register a student</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      {tours.map((tour) => {
                        const isDisabled =
                          tour.remaining === 0 || tour.status === "paused" || tour.status === "canceled"
                        const isSelected = tour.id === selectedTour
                        return (
                          <button
                            key={tour.id}
                            type="button"
                            className={`text-left rounded-lg border px-4 py-3 transition-all ${
                              isSelected ? "border-primary bg-primary/10 shadow-sm" : "border-border hover:border-primary"
                            } ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            onClick={() => !isDisabled && setSelectedTour(tour.id)}
                            disabled={isDisabled}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold">{tour.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(tour.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
                                  {new Date(tour.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                </p>
                              </div>
                              <Badge
                                className={
                                  tour.status === "paused" || tour.status === "canceled"
                                    ? "bg-gray-100 text-gray-800 border-gray-200"
                                    : tour.remaining === 0
                                      ? "bg-red-100 text-red-800 border-red-200"
                                      : "bg-green-100 text-green-800 border-green-200"
                                }
                              >
                                {tour.status === "paused"
                                  ? "Paused"
                                  : tour.status === "canceled"
                                    ? "Canceled"
                                    : tour.remaining === 0
                                      ? "Full"
                                      : "Open"}
                              </Badge>
                            </div>
                            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
                              <span>
                                {tour.remaining} / {tour.capacity} spots left
                              </span>
                              {isSelected && <span className="text-primary font-semibold">Selected</span>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                    {selectedTourDetails && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm">
                          <strong>Spots remaining:</strong> {selectedTourDetails.remaining}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Find Student</CardTitle>
                    <CardDescription>Search by name, email, or student ID</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <Input
                          placeholder="Enter name, email, or student ID..."
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value)
                            setSelectedStudent(null)
                          }}
                          onFocus={() => searchResults.length > 0 && setShowResults(true)}
                        />
                      </div>
                      <Button variant="outline" disabled>
                        <Search className="w-4 h-4 mr-2" />
                        {searching ? "Searching..." : "Type to search"}
                      </Button>
                    </div>

                    {showResults && (
                      <div className="border border-border rounded-lg bg-card shadow-sm overflow-hidden">
                        {searchResults.length === 0 && !searching ? (
                          <div className="p-3 text-sm text-muted-foreground flex items-center justify-between">
                            <span>No matches found</span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-transparent"
                              onClick={() => setWalkInMode(true)}
                            >
                              <UserPlus className="w-4 h-4 mr-2" />
                              Walk-in
                            </Button>
                          </div>
                        ) : (
                          <div className="max-h-56 overflow-y-auto">
                            {searchResults.map((student) => (
                              <button
                                key={student.id}
                                type="button"
                                className="w-full text-left px-4 py-3 hover:bg-muted transition-colors"
                                onClick={() => {
                                  setSelectedStudent(student)
                                  setSearchQuery(student.name)
                                  setShowResults(false)
                                  setWalkInMode(false)
                                  setWalkIn({ name: "", email: "", studentId: "" })
                                }}
                              >
                                <p className="font-semibold">{student.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {student.email} • {student.studentId}
                                </p>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {selectedStudent && (
                      <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg space-y-1">
                        <p className="font-semibold">{selectedStudent.name}</p>
                        <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                        <p className="text-sm text-muted-foreground">ID: {selectedStudent.studentId}</p>
                      </div>
                    )}

                    {!selectedStudent && searchQuery && !walkInMode && !showResults && (
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">No student selected. Use walk-in mode?</p>
                        <Button variant="outline" size="sm" className="mt-2 bg-transparent" onClick={() => setWalkInMode(true)}>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Register Walk-in
                        </Button>
                      </div>
                    )}

                    {walkInMode && (
                      <div className="space-y-3 p-4 border border-border rounded-lg">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={walkIn.name}
                            onChange={(e) => setWalkIn((prev) => ({ ...prev, name: e.target.value }))}
                            placeholder="Student name"
                          />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input
                            value={walkIn.email}
                            onChange={(e) => setWalkIn((prev) => ({ ...prev, email: e.target.value }))}
                            placeholder="student@iit.edu"
                          />
                        </div>
                        <div>
                          <Label>Student ID</Label>
                          <Input
                            value={walkIn.studentId}
                            onChange={(e) => setWalkIn((prev) => ({ ...prev, studentId: e.target.value }))}
                            placeholder="A20123456"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Register</CardTitle>
                    <CardDescription>Select number of tickets (max {maxTickets} per student)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Number of Tickets</Label>
                      <Select value={ticketCount.toString()} onValueChange={(v) => setTicketCount(Number.parseInt(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketOptions.map((option) => (
                            <SelectItem key={option} value={option.toString()}>
                              {option} ticket{option > 1 ? "s" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formError && <p className="text-sm text-destructive">{formError}</p>}

                    <Button className="w-full" size="lg" disabled={!canSubmit || submitting} onClick={handleRegister}>
                      {submitting ? "Submitting..." : "Complete Registration"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <Card className="border-primary">
                  <CardHeader className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <CardTitle className="text-3xl">Registration Complete!</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 text-center">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">Registration Code</p>
                      <p className="text-5xl font-bold text-primary tracking-wider">{registrationCode}</p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-1">
                      <p className="text-sm text-muted-foreground">Student</p>
                      <p className="font-semibold">{confirmationStudentName}</p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-1">
                      <p className="text-sm text-muted-foreground">Tour</p>
                      <p className="font-semibold">{selectedTourDetails?.name}</p>
                    </div>

                    <div className="p-4 bg-muted rounded-lg space-y-1">
                      <p className="text-sm text-muted-foreground">Tickets</p>
                      <p className="font-semibold">{ticketCount}</p>
                    </div>

                    <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg">
                      <p className="font-semibold">Spots left now: {selectedTourDetails?.remaining ?? 0}</p>
                    </div>

                    <Button onClick={resetForm} className="w-full" size="lg">
                      Register Another Student
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="checkin" className="space-y-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center">
                  {error}
                </div>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Check-in Management</CardTitle>
                  <CardDescription>Switch tours instantly to manage check-ins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {tours.map((tour) => (
                      <Button
                        key={tour.id}
                        variant={tour.id === checkinTour ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCheckinTour(tour.id)}
                      >
                        {tour.name}
                      </Button>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {registrations.filter((r) => r.checkedIn).length}
                      </p>
                      <p className="text-sm text-muted-foreground">Checked In</p>
                    </div>
                    <div className="flex-1 text-center">
                      <p className="text-2xl font-bold">{registrations.length}</p>
                      <p className="text-sm text-muted-foreground">Total Registered</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Registrants</CardTitle>
                  <Input placeholder="Search registrants..." className="mt-4" disabled />
                </CardHeader>
                <CardContent className="space-y-3">
                  {loadingRegistrations ? (
                    <p className="text-sm text-muted-foreground">Loading registrations…</p>
                  ) : registrations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No registrations for this tour yet.</p>
                  ) : (
                    registrations.map((reg) => (
                      <div key={reg.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                        <div className="flex-1">
                          <p className="font-semibold">{reg.student?.name || "Unknown student"}</p>
                          <p className="text-sm text-muted-foreground">
                            Code: {reg.code} • {reg.tickets} ticket{reg.tickets > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {reg.checkedIn && (
                            <Badge className="bg-green-100 text-green-800 border-green-200">Checked In</Badge>
                          )}
                          <Button
                            variant={reg.checkedIn ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleCheckIn(reg.id)}
                          >
                            {reg.checkedIn ? "Undo" : "Check In"}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
