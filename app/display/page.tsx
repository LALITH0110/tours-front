"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Clock, Users, AlertCircle } from "lucide-react"
import { apiClient, type Tour } from "../../lib/api"

export default function DisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string>("")
  const [editingTourId, setEditingTourId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [savingTourId, setSavingTourId] = useState<string | null>(null)
  const [editingAnnouncement, setEditingAnnouncement] = useState(false)
  const [announcementDraft, setAnnouncementDraft] = useState("")
  const [savingAnnouncement, setSavingAnnouncement] = useState(false)

  const getStartTimestamp = (value: string) => {
    const normalized = value.includes("T") ? value : value.replace(" ", "T")
    const parsed = new Date(normalized)
    if (!Number.isNaN(parsed.getTime())) return parsed.getTime()
    const match = normalized.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
    if (match) {
      const [, year, month, day, hour, minute] = match
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
      ).getTime()
    }
    return Number.MAX_SAFE_INTEGER
  }

  const sortedTours = useMemo(
    () => [...tours].sort((a, b) => getStartTimestamp(a.startTime) - getStartTimestamp(b.startTime)),
    [tours],
  )

  const hourGroups = useMemo(() => {
    const groups: { label: string; slotKey: string; tours: Tour[] }[] = []
    for (const tour of sortedTours) {
      const d = new Date(getStartTimestamp(tour.startTime))
      const slotKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`
      let group = groups.find((g) => g.slotKey === slotKey)
      if (!group) {
        const startLabel = d.toLocaleTimeString([], { hour: "numeric", hour12: true })
        const endD = new Date(d)
        endD.setHours(d.getHours() + 1, 0, 0, 0)
        const endLabel = endD.toLocaleTimeString([], { hour: "numeric", hour12: true })
        const dateLabel = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
        group = { label: `${dateLabel}  ·  ${startLabel} – ${endLabel}`, slotKey, tours: [] }
        groups.push(group)
      }
      group.tours.push(tour)
    }
    return groups
  }, [sortedTours])
  const [editingStatusTourId, setEditingStatusTourId] = useState<string | null>(null)
  const [statusSelection, setStatusSelection] = useState<"available" | "filling-fast" | "canceled">("available")
  const [savingStatusTourId, setSavingStatusTourId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const [data, settings] = await Promise.all([apiClient.listTours(), apiClient.getSettings()])
        if (mounted) {
          setTours(data)
          setAnnouncement(settings.announcement || "")
          setError(null)
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load tours")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    const refresh = setInterval(load, 5000)
    return () => {
      mounted = false
      clearInterval(refresh)
    }
  }, [])

  const getStatusColor = (status: Tour["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800 border-green-200"
      case "filling-fast":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "almost-full":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "full":
        return "bg-red-100 text-red-800 border-red-200"
      case "paused":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "canceled":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: Tour["status"]) => {
    switch (status) {
      case "available":
        return "Available"
      case "filling-fast":
        return "Filling Soon"
      case "almost-full":
        return "Almost Full"
      case "full":
        return "Full"
      case "paused":
        return "Paused"
      case "canceled":
        return "Canceled"
      default:
        return status
    }
  }

  const startEditingName = (tour: Tour) => {
    setEditingTourId(tour.id)
    setEditingName(tour.name)
  }

  const cancelEditingName = () => {
    setEditingTourId(null)
    setEditingName("")
  }

  const saveTourName = async (tourId: string) => {
    const trimmed = editingName.trim()
    if (!trimmed) {
      setError("Tour name cannot be empty")
      return
    }
    setSavingTourId(tourId)
    try {
      const updated = await apiClient.updateTour(tourId, { name: trimmed })
      setTours((prev) => prev.map((tour) => (tour.id === updated.id ? updated : tour)))
      setEditingTourId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tour name")
    } finally {
      setSavingTourId(null)
    }
  }

  const startEditingAnnouncement = () => {
    setAnnouncementDraft(announcement)
    setEditingAnnouncement(true)
  }

  const cancelEditingAnnouncement = () => {
    setEditingAnnouncement(false)
    setAnnouncementDraft(announcement)
  }

  const saveAnnouncement = async () => {
    const trimmed = announcementDraft.trim()
    setSavingAnnouncement(true)
    try {
      const updated = await apiClient.updateSettings({ announcement: trimmed })
      setAnnouncement(updated.announcement || "")
      setEditingAnnouncement(false)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update announcement")
    } finally {
      setSavingAnnouncement(false)
    }
  }

  const startEditingStatus = (tour: Tour) => {
    setEditingStatusTourId(tour.id)
    if (tour.status === "canceled") {
      setStatusSelection("canceled")
    } else if (tour.status === "available") {
      setStatusSelection("available")
    } else {
      setStatusSelection("filling-fast")
    }
  }

  const saveTourStatus = async (tour: Tour, nextStatus: "available" | "filling-fast" | "canceled") => {
    setSavingStatusTourId(tour.id)
    try {
      let updated: Tour | undefined
      if (nextStatus === "canceled") {
        updated = await apiClient.cancelTour(tour.id)
      } else {
        updated = await apiClient.updateTour(tour.id, {
          statusOverride: nextStatus,
          canceled: false,
          paused: false,
        })
      }
      if (updated) {
        setTours((prev) => prev.map((item) => (item.id === updated?.id ? updated : item)))
      }
      setEditingStatusTourId(null)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tour status")
    } finally {
      setSavingStatusTourId(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-5xl font-bold text-primary">Illinois Tech</h1>
              <p className="text-sm text-muted-foreground">Live Tour Display</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-balance">{"Today's Tours"}</h2>
              <p className="text-lg text-muted-foreground mt-2">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-primary">
                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Current Time</p>
            </div>
          </div>

          {/* Announcement banner — commented out to free up display space
          {editingAnnouncement ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <Input
                  value={announcementDraft}
                  onChange={(event) => setAnnouncementDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveAnnouncement()
                    if (event.key === "Escape") cancelEditingAnnouncement()
                  }}
                  placeholder="Enter announcement message"
                  aria-label="Announcement message"
                />
                <div className="flex gap-2">
                  <Button onClick={saveAnnouncement} disabled={savingAnnouncement}>
                    Save
                  </Button>
                  <Button variant="outline" onClick={cancelEditingAnnouncement} disabled={savingAnnouncement}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : announcement ? (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <button
                type="button"
                className="w-full text-center text-lg font-medium"
                onClick={startEditingAnnouncement}
                aria-label="Edit announcement"
              >
                <AlertCircle className="inline w-5 h-5 mr-2 -mt-0.5" />
                {announcement}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <Button variant="outline" onClick={startEditingAnnouncement}>
                Add announcement
              </Button>
            </div>
          )}
          */}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted-foreground">Loading tours…</div>
          ) : (
            <>
              <div className="space-y-10">
                {hourGroups.map((group) => (
                  <div key={group.slotKey}>
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-bold text-primary whitespace-nowrap">{group.label}</h3>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {group.tours.length} tour{group.tours.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      {group.tours.map((tour) => (
                        <Card key={tour.id} className="overflow-hidden">
                          <CardHeader className="bg-muted/50 pb-3">
                            <div className="flex items-start justify-between gap-3">
                              {editingTourId === tour.id ? (
                                <div className="flex flex-1 items-center gap-2">
                                  <Input
                                    value={editingName}
                                    onChange={(event) => setEditingName(event.target.value)}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") saveTourName(tour.id)
                                      if (event.key === "Escape") cancelEditingName()
                                    }}
                                    className="h-8 text-base"
                                    aria-label="Edit tour name"
                                    autoFocus
                                  />
                                  <Button size="sm" onClick={() => saveTourName(tour.id)} disabled={savingTourId === tour.id}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditingName} disabled={savingTourId === tour.id}>
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="text-left"
                                  onClick={() => startEditingName(tour)}
                                  aria-label={`Edit tour name ${tour.name}`}
                                >
                                  <CardTitle className="text-lg hover:underline leading-snug">{tour.name}</CardTitle>
                                </button>
                              )}
                              {editingStatusTourId === tour.id ? (
                                <Select
                                  value={statusSelection}
                                  onValueChange={(value) => {
                                    const next = value as "available" | "filling-fast" | "canceled"
                                    setStatusSelection(next)
                                    void saveTourStatus(tour, next)
                                  }}
                                  onOpenChange={(open) => {
                                    if (!open) setEditingStatusTourId(null)
                                  }}
                                >
                                  <SelectTrigger className="h-8 w-[160px]" disabled={savingStatusTourId === tour.id}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">
                                      <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-green-500" />
                                        Available
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="filling-fast">
                                      <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-orange-500" />
                                        Filling Soon
                                      </span>
                                    </SelectItem>
                                    <SelectItem value="canceled">
                                      <span className="inline-flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-red-500" />
                                        Canceled
                                      </span>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                <button type="button" onClick={() => startEditingStatus(tour)} className="shrink-0">
                                  <Badge className={getStatusColor(tour.status)}>{getStatusLabel(tour.status)}</Badge>
                                </button>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-3">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm">
                                {new Date(tour.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} –{" "}
                                {new Date(tour.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-primary shrink-0" />
                              <div className="flex-1">
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-2xl font-bold text-primary">{tour.remaining}</span>
                                  <span className="text-sm text-muted-foreground">/ {tour.capacity} left</span>
                                </div>
                                <div className="mt-1.5 h-2 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary transition-all"
                                    style={{ width: `${((tour.capacity - tour.remaining) / tour.capacity) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>Updates automatically every 5 seconds</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
