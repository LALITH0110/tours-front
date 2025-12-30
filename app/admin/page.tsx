"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, Users, Calendar, BarChart3, Upload, Download } from "lucide-react"
import { apiClient, type Registration, type Tour } from "../../lib/api"

export default function AdminPage() {
  const [maxTickets, setMaxTickets] = useState(2)
  const [fillingFastThreshold, setFillingFastThreshold] = useState(25)
  const [announcement, setAnnouncement] = useState("")
  const [tours, setTours] = useState<Tour[]>([])
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [creatingTour, setCreatingTour] = useState(false)
  const [tourActionId, setTourActionId] = useState<string | null>(null)
  const [newTour, setNewTour] = useState({
    name: "",
    startTime: "",
    endTime: "",
    capacity: "",
  })
  const [overrideCapacity, setOverrideCapacity] = useState<Record<string, string>>({})
  const [editingTourId, setEditingTourId] = useState<string | null>(null)
  const [editTour, setEditTour] = useState({
    name: "",
    startTime: "",
    endTime: "",
    capacity: "",
  })

  const workers = [
    { id: "1", name: "Alice Johnson", email: "ajohnson@iit.edu", active: true },
    { id: "2", name: "Bob Williams", email: "bwilliams@iit.edu", active: true },
    { id: "3", name: "Carol Davis", email: "cdavis@iit.edu", active: false },
  ]

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, tourData, regData] = await Promise.all([
          apiClient.getSettings(),
          apiClient.listTours(),
          apiClient.listRegistrations(),
        ])
        setMaxTickets(settings.maxTicketsPerStudent || 2)
        setFillingFastThreshold(Math.round((settings.fillingFastThreshold || 0.25) * 100))
        setAnnouncement(settings.announcement || "")
        setTours(tourData)
        setRegistrations(regData)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load admin data")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const refreshTours = async () => {
    const data = await apiClient.listTours()
    setTours(data)
  }

  const refreshRegistrations = async () => {
    const data = await apiClient.listRegistrations()
    setRegistrations(data)
  }

  const handleCreateTour = async () => {
    if (!newTour.name || !newTour.startTime || !newTour.endTime || !newTour.capacity) {
      setError("Name, start time, end time, and capacity are required")
      return
    }
    const cap = Number.parseInt(newTour.capacity, 10)
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Capacity must be a positive integer")
      return
    }
    setCreatingTour(true)
    try {
      await apiClient.createTour({
        name: newTour.name,
        startTime: new Date(newTour.startTime).toISOString(),
        endTime: new Date(newTour.endTime).toISOString(),
        capacity: cap,
      })
      setNewTour({ name: "", startTime: "", endTime: "", capacity: "" })
      await refreshTours()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tour")
    } finally {
      setCreatingTour(false)
    }
  }

  const handleOverrideCapacity = async (tourId: string) => {
    const value = overrideCapacity[tourId]
    const cap = Number.parseInt(value || "", 10)
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Override capacity must be a positive integer")
      return
    }
    setTourActionId(tourId)
    try {
      const updated = await apiClient.overrideCapacity(tourId, cap)
      setTours((prev) => prev.map((tour) => (tour.id === updated.id ? updated : tour)))
      setOverrideCapacity((prev) => ({ ...prev, [tourId]: "" }))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to override capacity")
    } finally {
      setTourActionId(null)
    }
  }

  const handlePauseToggle = async (tour: Tour) => {
    setTourActionId(tour.id)
    try {
      const updated = tour.status === "paused" ? await apiClient.resumeTour(tour.id) : await apiClient.pauseTour(tour.id)
      setTours((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tour status")
    } finally {
      setTourActionId(null)
    }
  }

  const handleCancelTour = async (tour: Tour) => {
    setTourActionId(tour.id)
    try {
      const updated = await apiClient.cancelTour(tour.id)
      setTours((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel tour")
    } finally {
      setTourActionId(null)
    }
  }

  const handleUncancelTour = async (tour: Tour) => {
    setTourActionId(tour.id)
    try {
      const updated = await apiClient.uncancelTour(tour.id)
      setTours((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to uncancel tour")
    } finally {
      setTourActionId(null)
    }
  }

  const startEditTour = (tour: Tour) => {
    setEditingTourId(tour.id)
    setEditTour({
      name: tour.name,
      startTime: tour.startTime.slice(0, 16),
      endTime: tour.endTime.slice(0, 16),
      capacity: String(tour.capacity),
    })
  }

  const cancelEditTour = () => {
    setEditingTourId(null)
    setEditTour({ name: "", startTime: "", endTime: "", capacity: "" })
  }

  const handleSaveTourEdits = async (tourId: string) => {
    const cap = Number.parseInt(editTour.capacity, 10)
    if (!editTour.name || !editTour.startTime || !editTour.endTime) {
      setError("Name, start time, and end time are required")
      return
    }
    if (!Number.isFinite(cap) || cap < 1) {
      setError("Capacity must be a positive integer")
      return
    }
    setTourActionId(tourId)
    try {
      const updated = await apiClient.updateTour(tourId, {
        name: editTour.name,
        startTime: new Date(editTour.startTime).toISOString(),
        endTime: new Date(editTour.endTime).toISOString(),
        capacity: cap,
      })
      setTours((prev) => prev.map((item) => (item.id === updated.id ? updated : item)))
      setEditingTourId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tour")
    } finally {
      setTourActionId(null)
    }
  }

  const handleSaveSettings = async () => {
    if (!Number.isFinite(maxTickets) || maxTickets < 1) {
      setError("Max tickets must be a positive number")
      return
    }
    if (!Number.isFinite(fillingFastThreshold) || fillingFastThreshold <= 0) {
      setError("Filling fast threshold must be a positive number")
      return
    }
    setSavingSettings(true)
    try {
      await apiClient.updateSettings({
        maxTicketsPerStudent: maxTickets,
        fillingFastThreshold,
        announcement,
      })
      await refreshTours()
      await refreshRegistrations()
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings")
    } finally {
      setSavingSettings(false)
    }
  }

  const totalRegistered = useMemo(
    () => registrations.reduce((sum, reg) => sum + reg.tickets, 0),
    [registrations],
  )
  const totalCheckedIn = useMemo(
    () => registrations.reduce((sum, reg) => sum + (reg.checkedIn ? reg.tickets : 0), 0),
    [registrations],
  )

  const busiestTour = useMemo(() => {
    if (!tours.length) return null
    return tours.reduce((prev, curr) => (curr.registered > prev.registered ? curr : prev))
  }, [tours])

  const noShowRate = totalRegistered === 0 ? 0 : ((totalRegistered - totalCheckedIn) / totalRegistered) * 100

  const tourStatusLabel = (status: Tour["status"]) => {
    switch (status) {
      case "filling-fast":
        return "Filling Fast"
      case "almost-full":
        return "Almost Full"
      case "paused":
        return "Paused"
      case "canceled":
        return "Canceled"
      default:
        return status.charAt(0).toUpperCase() + status.slice(1)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Illinois Tech</h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
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
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center mb-6">
            {error}
          </div>
        )}
        <Tabs defaultValue="tours" className="space-y-6">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4">
            <TabsTrigger value="tours">Tours</TabsTrigger>
            <TabsTrigger value="workers">Workers</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="tours" className="space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Tour Management</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Create New Tour</CardTitle>
                  <CardDescription>Set schedule and capacity for a new tour session</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="tour-name">Tour Name</Label>
                    <Input
                      id="tour-name"
                      value={newTour.name}
                      onChange={(e) => setNewTour((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Engineering Campus Tour"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tour-capacity">Capacity</Label>
                    <Input
                      id="tour-capacity"
                      type="number"
                      min={1}
                      value={newTour.capacity}
                      onChange={(e) => setNewTour((prev) => ({ ...prev, capacity: e.target.value }))}
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tour-start">Start Time</Label>
                    <Input
                      id="tour-start"
                      type="datetime-local"
                      value={newTour.startTime}
                      onChange={(e) => setNewTour((prev) => ({ ...prev, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tour-end">End Time</Label>
                    <Input
                      id="tour-end"
                      type="datetime-local"
                      value={newTour.endTime}
                      onChange={(e) => setNewTour((prev) => ({ ...prev, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={handleCreateTour} disabled={creatingTour}>
                      <Calendar className="w-4 h-4 mr-2" />
                      {creatingTour ? "Creating..." : "Create Tour"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading tours…</p>
              ) : (
                <div className="space-y-4">
                  {tours.map((tour) => (
                    <Card key={tour.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle>{tour.name}</CardTitle>
                            <CardDescription>
                              Starts at{" "}
                              {new Date(tour.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                            </CardDescription>
                          </div>
                          <Badge className="bg-green-100 text-green-800 border-green-200">{tourStatusLabel(tour.status)}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-4 gap-4 mb-4">
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold text-primary">{tour.capacity}</p>
                            <p className="text-sm text-muted-foreground">Capacity</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{tour.registered}</p>
                            <p className="text-sm text-muted-foreground">Registered</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{tour.checkedIn}</p>
                            <p className="text-sm text-muted-foreground">Checked In</p>
                          </div>
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-2xl font-bold">{tour.remaining}</p>
                            <p className="text-sm text-muted-foreground">Remaining</p>
                          </div>
                        </div>

                        {editingTourId === tour.id ? (
                          <div className="grid gap-3 md:grid-cols-2 mb-4">
                            <div className="space-y-2">
                              <Label>Tour Name</Label>
                              <Input
                                value={editTour.name}
                                onChange={(e) => setEditTour((prev) => ({ ...prev, name: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Capacity</Label>
                              <Input
                                type="number"
                                min={tour.registered}
                                value={editTour.capacity}
                                onChange={(e) => setEditTour((prev) => ({ ...prev, capacity: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Start Time</Label>
                              <Input
                                type="datetime-local"
                                value={editTour.startTime}
                                onChange={(e) => setEditTour((prev) => ({ ...prev, startTime: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>End Time</Label>
                              <Input
                                type="datetime-local"
                                value={editTour.endTime}
                                onChange={(e) => setEditTour((prev) => ({ ...prev, endTime: e.target.value }))}
                              />
                            </div>
                            <div className="flex gap-2 md:col-span-2">
                              <Button onClick={() => handleSaveTourEdits(tour.id)} disabled={tourActionId === tour.id}>
                                Save Changes
                              </Button>
                              <Button variant="outline" onClick={cancelEditTour} disabled={tourActionId === tour.id}>
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        <div className="grid gap-3 md:grid-cols-[1fr_auto] items-center">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={tour.registered}
                              placeholder={`Override (>= ${tour.registered})`}
                              value={overrideCapacity[tour.id] || ""}
                              onChange={(e) =>
                                setOverrideCapacity((prev) => ({ ...prev, [tour.id]: e.target.value }))
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOverrideCapacity(tour.id)}
                              disabled={tourActionId === tour.id}
                            >
                              Override Capacity
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditTour(tour)}
                              disabled={tourActionId === tour.id}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePauseToggle(tour)}
                              disabled={tour.status === "canceled" || tourActionId === tour.id}
                            >
                              {tour.status === "paused" ? "Resume" : "Pause"}
                            </Button>
                            {tour.status === "canceled" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUncancelTour(tour)}
                                disabled={tourActionId === tour.id}
                              >
                                Uncancel
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelTour(tour)}
                                disabled={tourActionId === tour.id}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="workers" className="space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Worker Management</h2>
                <Button disabled>
                  <Users className="w-4 h-4 mr-2" />
                  Add Worker
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Active Workers</CardTitle>
                  <CardDescription>Manage worker accounts and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workers.map((worker) => (
                    <div
                      key={worker.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg"
                    >
                      <div>
                        <p className="font-semibold">{worker.name}</p>
                        <p className="text-sm text-muted-foreground">{worker.email}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`worker-${worker.id}`} className="text-sm">
                            Active
                          </Label>
                          <Switch id={`worker-${worker.id}`} checked={worker.active} disabled />
                        </div>
                        <Button variant="outline" size="sm" disabled>
                          View Audit Trail
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure global tour registration settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="max-tickets">Max Tickets Per Student</Label>
                    <Input
                      id="max-tickets"
                      type="number"
                      value={maxTickets}
                      onChange={(e) => setMaxTickets(Number.parseInt(e.target.value, 10))}
                      min={1}
                      max={5}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="filling-fast">{"Filling Fast Threshold (%)"}</Label>
                    <Input
                      id="filling-fast"
                      type="number"
                      value={fillingFastThreshold}
                      onChange={(e) => setFillingFastThreshold(Number.parseInt(e.target.value, 10))}
                      min={5}
                      max={50}
                    />
                    <p className="text-sm text-muted-foreground">
                      Tours show as "Filling Fast" when {fillingFastThreshold}% or less capacity remains
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="announcement">Landing Page Announcement</Label>
                    <Input
                      id="announcement"
                      placeholder="Next tour leaves from Booth A"
                      value={announcement}
                      onChange={(e) => setAnnouncement(e.target.value)}
                    />
                  </div>

                  <Button onClick={handleSaveSettings} disabled={savingSettings}>
                    {savingSettings ? "Saving..." : "Save Settings"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Student List Management</h2>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Import Students</CardTitle>
                  <CardDescription>Upload CSV file to import student information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <Button variant="outline" disabled>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    CSV should include: Name, Email, Student ID. Duplicates will be identified by email.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Export Data</CardTitle>
                  <CardDescription>Download registration data for analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export All Students
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export Registrations by Tour
                  </Button>
                  <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Export Check-in Records
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Reports & Analytics</h2>
              </div>

              {loading ? (
                <p className="text-sm text-muted-foreground">Loading reports…</p>
              ) : (
                <>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Attendees Today</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold text-primary">{totalRegistered}</p>
                        <p className="text-sm text-muted-foreground mt-1">Across all tours</p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Busiest Tour</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg font-bold">{busiestTour?.name ?? "—"}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {busiestTour ? `${busiestTour.registered} registered` : "No data"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">No-Show Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-4xl font-bold">{noShowRate.toFixed(1)}%</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {totalRegistered - totalCheckedIn} of {totalRegistered || 0} not checked in
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Tour Performance</CardTitle>
                      <CardDescription>{"Today's registration and attendance breakdown"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {tours.map((tour) => (
                          <div key={tour.id} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{tour.name}</span>
                              <span className="text-muted-foreground">
                                {tour.registered}/{tour.capacity} registered • {tour.checkedIn} checked in
                              </span>
                            </div>
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{
                                  width: `${tour.capacity === 0 ? 0 : Math.min(100, (tour.registered / tour.capacity) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Generate Reports</CardTitle>
                      <CardDescription>Create detailed reports for analysis</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Daily Summary Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Weekly Attendance Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start bg-transparent" disabled>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Worker Activity Report
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
