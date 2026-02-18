import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarDays, Users, Settings } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">Illinois Tech</h1>
              <p className="text-sm text-muted-foreground">Campus Tour Registration</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-bold text-balance">Welcome to Ticket Exchange Registration</h2>
            <p className="text-xl text-muted-foreground text-balance max-w-2xl mx-auto">
              Experience Illinois Tech through our guided campus tours. Choose your role to get started.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <Link href="/display" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Live Display</CardTitle>
                  <CardDescription className="text-base">View today's tours and real-time availability</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Perfect for visitors to see what tours are available, when they start, and how many spots remain.
                  </p>
                  <Button className="w-full mt-6 bg-transparent" variant="outline">
                    View Tours
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/display2" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <CalendarDays className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Live Display 2</CardTitle>
                  <CardDescription className="text-base">All tour events in one compact view</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    See every tour event card at a glance — all tours displayed together in a single section.
                  </p>
                  <Button className="w-full mt-6 bg-transparent" variant="outline">
                    View All Tours
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/worker" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Worker Portal</CardTitle>
                  <CardDescription className="text-base">Register students and manage check-ins</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    For staff to register students for tours, manage tickets, and handle check-ins efficiently.
                  </p>
                  <Button className="w-full mt-6 bg-transparent" variant="outline">
                    Access Portal
                  </Button>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin" className="block group">
              <Card className="h-full transition-all hover:shadow-lg hover:border-primary">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Settings className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Admin Panel</CardTitle>
                  <CardDescription className="text-base">Manage tours, workers, and system settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Complete control over tour management, worker accounts, student lists, and reporting.
                  </p>
                  <Button className="w-full mt-6 bg-transparent" variant="outline">
                    Manage System
                  </Button>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="mt-16 p-8 rounded-lg bg-card border border-border">
            <h3 className="text-2xl font-bold mb-4">Getting Started</h3>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong className="text-foreground">Live Display:</strong> Public-facing screen showing available
                  tours, filling fast alerts, and real-time capacity updates
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong className="text-foreground">Worker Portal:</strong> Staff interface for registering students,
                  selecting tours, and managing check-ins
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong className="text-foreground">Admin Panel:</strong> Full system management including tour setup,
                  worker accounts, and reporting
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main >

      <footer className="border-t border-border mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Illinois Tech Campus Tours. All rights reserved.</p>
        </div>
      </footer>
    </div >
  )
}
