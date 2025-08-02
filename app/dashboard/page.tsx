import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Clock, CheckCircle, AlertCircle, Users, Plus, BarChart3 } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Fetch user's tickets
  const { data: userTickets } = await supabase
    .from("tickets")
    .select(`
      *,
      categories (
        id,
        name,
        color
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch assigned tickets for agents/admins
  let assignedTickets = []
  if (["agent", "admin"].includes(user.role)) {
    const { data } = await supabase
      .from("tickets")
      .select(`
        *,
        categories (
          id,
          name,
          color
        ),
        users!tickets_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("assigned_agent_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)
    assignedTickets = data || []
  }

  // Fetch system statistics for agents/admins
  let systemStats = null
  if (["agent", "admin"].includes(user.role)) {
    const { data: allTickets } = await supabase.from("tickets").select("status, priority")
    if (allTickets) {
      systemStats = {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === "open").length,
        in_progress: allTickets.filter((t) => t.status === "in_progress").length,
        resolved: allTickets.filter((t) => t.status === "resolved").length,
        urgent: allTickets.filter((t) => t.priority === "urgent").length,
      }
    }
  }

  // Calculate user's ticket statistics
  const userStats = {
    total: userTickets?.length || 0,
    open: userTickets?.filter((t) => t.status === "open").length || 0,
    in_progress: userTickets?.filter((t) => t.status === "in_progress").length || 0,
    resolved: userTickets?.filter((t) => t.status === "resolved").length || 0,
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-red-100 text-red-800"
      case "in_progress":
        return "bg-yellow-100 text-yellow-800"
      case "resolved":
        return "bg-green-100 text-green-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.full_name.split(" ")[0]}!</h1>
          <p className="mt-2 text-gray-600">
            {user.role === "user"
              ? "Here's an overview of your support tickets."
              : "Here's an overview of the support system and your assigned tickets."}
          </p>
        </div>

        {/* System Statistics - Only for agents/admins */}
        {systemStats && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.total}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Open</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{systemStats.open}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{systemStats.in_progress}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{systemStats.resolved}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Urgent</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{systemStats.urgent}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Personal Statistics */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tickets</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Ticket className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userStats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{userStats.open}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{userStats.in_progress}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{userStats.resolved}</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Tickets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tickets</CardTitle>
                <CardDescription>Your latest support requests</CardDescription>
              </div>
              <Button asChild size="sm">
                <Link href="/tickets/new">
                  <Plus className="h-4 w-4 mr-2" />
                  New Ticket
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {userTickets && userTickets.length > 0 ? (
                <div className="space-y-4">
                  {userTickets.map((ticket) => (
                    <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h4>
                        <p className="text-sm text-gray-600">#{ticket.id.slice(0, 8)}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getStatusColor(ticket.status)} variant="secondary">
                            {ticket.status.replace("_", " ")}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                            {ticket.priority}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(ticket.created_at)}</p>
                        <Button asChild size="sm" variant="outline" className="mt-2 bg-transparent">
                          <Link href={`/tickets/${ticket.id}`}>View</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets yet</h3>
                  <p className="text-gray-600 mb-4">Create your first support ticket to get started.</p>
                  <Button asChild>
                    <Link href="/tickets/new">Create Ticket</Link>
                  </Button>
                </div>
              )}
              {userTickets && userTickets.length > 0 && (
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/tickets">View All Tickets</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Tickets - Only for agents/admins */}
          {["agent", "admin"].includes(user.role) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assigned to You</CardTitle>
                  <CardDescription>Tickets you're currently handling</CardDescription>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link href="/tickets/manage">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Manage All
                  </Link>
                </Button>
              </CardHeader>
              <CardContent>
                {assignedTickets.length > 0 ? (
                  <div className="space-y-4">
                    {assignedTickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 line-clamp-1">{ticket.subject}</h4>
                          <p className="text-sm text-gray-600">
                            #{ticket.id.slice(0, 8)} • {ticket.users?.full_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={getStatusColor(ticket.status)} variant="secondary">
                              {ticket.status.replace("_", " ")}
                            </Badge>
                            <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                              {ticket.priority}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatDate(ticket.created_at)}</p>
                          <Button asChild size="sm" variant="outline" className="mt-2 bg-transparent">
                            <Link href={`/tickets/${ticket.id}`}>Manage</Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assigned tickets</h3>
                    <p className="text-gray-600">You don't have any tickets assigned to you yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions - Only for regular users */}
          {user.role === "user" && (
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button asChild className="w-full justify-start">
                  <Link href="/tickets/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Ticket
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full justify-start bg-transparent">
                  <Link href="/tickets">
                    <Ticket className="h-4 w-4 mr-2" />
                    View All My Tickets
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
