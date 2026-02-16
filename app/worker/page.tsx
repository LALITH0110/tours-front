"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { apiClient, type Registration, type Tour } from "../../lib/api"

export default function WorkerPage() {
  const [tours, setTours] = useState<Tour[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [selectedTour, setSelectedTour] = useState("")
  const [checkinTour, setCheckinTour] = useState("")
  const [name, setName] = useState("")
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmedName, setConfirmedName] = useState("")
  const [loadingTours, setLoadingTours] = useState(true)
  const [loadingRegistrations, setLoadingRegistrations] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const selectedTourDetails = tours.find((t) => t.id === selectedTour)

  useEffect(() => {
    const loadInitial = async () => {
      await refreshTours()
      await refreshRegistrations()
    }
    loadInitial()
  }, [])

  useEffect(() => {
    if (checkinTour) refreshRegistrations(checkinTour)
  }, [checkinTour])

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

  const handleRegister = async () => {
    setFormError(null)
    if (!selectedTour) {
      setFormError("Select a tour")
      return
    }
    if (!name.trim()) {
      setFormError("Enter student name")
      return
    }
    setSubmitting(true)
    try {
      const { tour } = await apiClient.createRegistration({ tourId: selectedTour, name: name.trim() })
      setConfirmedName(name.trim())
      setShowConfirmation(true)
      setTours((prev) => prev.map((t) => (t.id === tour.id ? tour : t)))
      await refreshRegistrations(checkinTour || selectedTour)
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
    setName("")
    setShowConfirmation(false)
    setConfirmedName("")
    setFormError(null)
  }

  const canSubmit = !!selectedTour && !!name.trim()

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
                    <CardTitle>Student Name</CardTitle>
                    <CardDescription>First name and last initial (e.g. John D)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Name</Label>
                      <Input
                        id="student-name"
                        placeholder="John D"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && canSubmit && !submitting && handleRegister()}
                        autoComplete="off"
                      />
                    </div>
                    {formError && <p className="text-sm text-destructive">{formError}</p>}
                    <Button className="w-full" size="lg" disabled={!canSubmit || submitting} onClick={handleRegister}>
                      {submitting ? "Checking in..." : "Check In & Complete Registration"}
                    </Button>
                    {showConfirmation && (
                      <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900">{confirmedName} checked in</p>
                            <p className="text-sm text-green-700">{selectedTourDetails?.remaining ?? 0} spots remaining</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="text-xs text-green-600 underline shrink-0"
                          onClick={resetForm}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </CardContent>
                </Card>
            </div>
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
                          <p className="text-sm text-muted-foreground">Code: {reg.code}</p>
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
