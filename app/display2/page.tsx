"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Users } from "lucide-react"
import { apiClient, type Tour } from "../../lib/api"

type Tab = "all" | "grouped"

export default function DisplayPage2() {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [tours, setTours] = useState<Tour[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<Tab>("all")

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

    // Group by tour name, preserving chronological order within each group
    const tourGroups = useMemo(() => {
        const map = new Map<string, Tour[]>()
        for (const tour of sortedTours) {
            const key = tour.name
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(tour)
        }
        // Sort groups by the earliest start time in each group
        return Array.from(map.entries()).sort(
            (a, b) => getStartTimestamp(a[1][0].startTime) - getStartTimestamp(b[1][0].startTime),
        )
    }, [sortedTours])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        let mounted = true
        const load = async () => {
            try {
                const data = await apiClient.listTours()
                if (mounted) { setTours(data); setError(null) }
            } catch (err) {
                if (mounted) setError(err instanceof Error ? err.message : "Failed to load tours")
            } finally {
                if (mounted) setLoading(false)
            }
        }
        load()
        const refresh = setInterval(load, 5000)
        return () => { mounted = false; clearInterval(refresh) }
    }, [])

    const getStatusColor = (status: Tour["status"]) => {
        switch (status) {
            case "available": return "bg-green-100 text-green-800 border-green-200"
            case "filling-fast": return "bg-orange-100 text-orange-800 border-orange-200"
            case "almost-full": return "bg-orange-100 text-orange-800 border-orange-200"
            case "full": return "bg-red-100 text-red-800 border-red-200"
            case "paused": return "bg-gray-100 text-gray-800 border-gray-200"
            case "canceled": return "bg-red-100 text-red-800 border-red-200"
            default: return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatusLabel = (status: Tour["status"]) => {
        switch (status) {
            case "available": return "Available"
            case "filling-fast": return "Filling Soon"
            case "almost-full": return "Almost Full"
            case "full": return "Full"
            case "paused": return "Paused"
            case "canceled": return "Canceled"
            default: return status
        }
    }

    const TourCard = ({ tour }: { tour: Tour }) => (
        <Card className="overflow-hidden">
            <CardHeader className="bg-muted/50 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-xs font-semibold leading-snug line-clamp-2">
                        {tour.name}
                    </CardTitle>
                    <Badge className={`${getStatusColor(tour.status)} text-[9px] px-1 py-0 shrink-0 leading-4`}>
                        {getStatusLabel(tour.status)}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="px-3 py-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="w-3 h-3 text-primary shrink-0" />
                    <span className="text-[11px]">
                        {new Date(tour.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                        {" – "}
                        {new Date(tour.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <Users className="w-3 h-3 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1">
                            <span className="text-sm font-bold text-primary">{tour.remaining}</span>
                            <span className="text-[11px] text-muted-foreground">/ {tour.capacity} left</span>
                        </div>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${((tour.capacity - tour.remaining) / tour.capacity) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-primary">Illinois Tech</h1>
                            <p className="text-xs text-muted-foreground">Live Tour Display 2</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-primary">
                                {currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {currentTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-6">
                <div className="space-y-4">
                    {/* Header + tab switcher */}
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">All Tour Events</h2>
                        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setTab("all")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "all"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                All at Once
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab("grouped")}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === "grouped"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                By Tour Name
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg text-center text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center text-muted-foreground py-12">Loading tours…</div>
                    ) : sortedTours.length === 0 ? (
                        <div className="text-center text-muted-foreground py-12">No tours scheduled.</div>
                    ) : tab === "all" ? (
                        <>
                            <div className="grid grid-cols-4 gap-3 xl:grid-cols-5 2xl:grid-cols-6">
                                {sortedTours.map((tour) => (
                                    <TourCard key={tour.id} tour={tour} />
                                ))}
                            </div>
                            <div className="text-center text-xs text-muted-foreground pt-2">
                                Updates automatically every 5 seconds
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-6">
                                {tourGroups.map(([name, groupTours]) => (
                                    <div key={name}>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-base font-bold text-primary whitespace-nowrap">{name}</h3>
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {groupTours.length} slot{groupTours.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-5 gap-2">
                                            {groupTours.map((tour) => (
                                                <TourCard key={tour.id} tour={tour} />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center text-xs text-muted-foreground pt-2">
                                Updates automatically every 5 seconds
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    )
}
