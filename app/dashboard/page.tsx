import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Ticket, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireAuth()

  // Fetch user's tickets
  const { data: tickets } = await supabase
    .from("tickets")
    .select(`
      *,
      categories (name, color),
      users!tickets_assigned_agent_id_fkey (full_name)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  // Get ticket counts by status
  const { data: ticketCounts } = await supabase.from("tickets").select("status").eq("user_id", user.id)

  const statusCounts = {
    open: ticketCounts?.filter((t) => t.status === "open").length || 0,
    in_progress: ticketCounts?.filter((t) => t.status === "in_progress").length || 0,
    resolved: ticketCounts?.filter((t) => t.status === "resolved").length || 0,
    closed: ticketCounts?.filter((t) => t.status === "closed").length || 0,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user.full_name}!</h1>
          <p className="text-gray-600">Here's an overview of your support tickets.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.in_progress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statusCounts.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statusCounts.open + statusCounts.in_progress + statusCounts.resolved + statusCounts.closed}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Tickets</CardTitle>
              <CardDescription>Your latest support requests</CardDescription>
            </div>
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {tickets && tickets.length > 0 ? (
              <div className="space-y-4">
                {tickets.map((ticket: any) => (
                  <div key={ticket.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">{ticket.subject}</h3>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ticket.description.substring(0, 100)}...</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Category: {ticket.categories?.name || "Uncategorized"}</span>
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.users?.full_name && <span>Assigned to: {ticket.users.full_name}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tickets/${ticket.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Ticket className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No tickets yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by creating your first support ticket.</p>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/tickets/new">
                      <Plus className="mr-2 h-4 w-4" />
                      New Ticket
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
