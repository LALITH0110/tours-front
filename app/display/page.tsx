"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, Users, AlertCircle } from "lucide-react"
import { apiClient, type Tour } from "../../lib/api"

export default function DisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [announcement, setAnnouncement] = useState<string>("")

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
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "almost-full":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "full":
        return "bg-red-100 text-red-800 border-red-200"
      case "paused":
        return "bg-gray-100 text-gray-800 border-gray-200"
      case "canceled":
        return "bg-gray-100 text-gray-800 border-gray-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusLabel = (status: Tour["status"]) => {
    switch (status) {
      case "available":
        return "Available"
      case "filling-fast":
        return "Filling Fast"
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Illinois Tech</h1>
              <p className="text-sm text-muted-foreground">Live Tour Display</p>
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
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-5xl font-bold text-balance">{"Today's Tours"}</h2>
              <p className="text-xl text-muted-foreground mt-2">
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

          {announcement && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-center text-lg font-medium">
                <AlertCircle className="inline w-5 h-5 mr-2 -mt-0.5" />
                {announcement}
              </p>
            </div>
          )}

          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center text-muted-foreground">Loading tours…</div>
          ) : (
            <>
              <div className="grid lg:grid-cols-2 gap-6">
                {tours.map((tour) => (
                  <Card key={tour.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-2xl">{tour.name}</CardTitle>
                        <Badge className={getStatusColor(tour.status)}>{getStatusLabel(tour.status)}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock className="w-5 h-5 text-primary" />
                          <span className="text-lg">
                            {new Date(tour.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} -{" "}
                            {new Date(tour.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <Users className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <span className="text-3xl font-bold text-primary">{tour.remaining}</span>
                              <span className="text-lg text-muted-foreground">/ {tour.capacity} spots left</span>
                            </div>
                            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${((tour.capacity - tour.remaining) / tour.capacity) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
