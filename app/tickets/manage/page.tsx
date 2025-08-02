import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Ticket, Clock, CheckCircle, AlertCircle, Users, Calendar, Tag, User } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function ManageTicketsPage() {
  const user = await requireAuth()

  // Check if user has permission to access this page
  if (!["agent", "admin"].includes(user.role)) {
    redirect("/dashboard")
  }

  // Fetch all tickets with related data
  const { data: allTickets, error } = await supabase
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
      ),
      assigned_agent:users!tickets_assigned_agent_id_fkey (
        id,
        full_name,
        email
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tickets:", error)
  }

  const tickets = allTickets || []

  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    unassigned: tickets.filter((t) => !t.assigned_agent_id).length,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
  }

  // Filter tickets by status
  const openTickets = tickets.filter((t) => t.status === "open")
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress")
  const resolvedTickets = tickets.filter((t) => t.status === "resolved")
  const closedTickets = tickets.filter((t) => t.status === "closed")
  const unassignedTickets = tickets.filter((t) => !t.assigned_agent_id)

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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const TicketCard = ({ ticket }: { ticket: any }) => (
    <Card key={ticket.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900 mb-1 line-clamp-1">{ticket.subject}</h3>
            <p className="text-sm text-gray-600 mb-2">#{ticket.id.slice(0, 8)}</p>
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">{ticket.description}</p>
          </div>
          <div className="flex flex-col gap-2 ml-4">
            <Badge className={getStatusColor(ticket.status)} variant="secondary">
              {ticket.status.replace("_", " ")}
            </Badge>
            <Badge className={getPriorityColor(ticket.priority)} variant="outline">
              {ticket.priority}
            </Badge>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-500">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1">
              <User className="h-4 w-4" />
              {ticket.users?.full_name || "Unknown User"}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(ticket.created_at)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            {ticket.categories && (
              <span className="flex items-center gap-1">
                <Tag className="h-4 w-4" />
                {ticket.categories.name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              {ticket.assigned_agent?.full_name || "Unassigned"}
            </span>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button asChild size="sm" variant="outline">
            <Link href={`/tickets/${ticket.id}`}>Manage</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
          <p className="mt-2 text-gray-600">Manage and oversee all support tickets in the system.</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <Ticket className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Closed</CardTitle>
              <CheckCircle className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <Users className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tickets Tabs */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
            <TabsTrigger value="open">Open ({stats.open})</TabsTrigger>
            <TabsTrigger value="in_progress">In Progress ({stats.in_progress})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
            <TabsTrigger value="closed">Closed ({stats.closed})</TabsTrigger>
            <TabsTrigger value="unassigned">Unassigned ({stats.unassigned})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {tickets.length === 0 && (
              <div className="text-center py-12">
                <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets found</h3>
                <p className="text-gray-600">There are no tickets in the system yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="open" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {openTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {openTickets.length === 0 && (
              <div className="text-center py-12">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No open tickets</h3>
                <p className="text-gray-600">All tickets have been addressed!</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="in_progress" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inProgressTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {inProgressTickets.length === 0 && (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tickets in progress</h3>
                <p className="text-gray-600">No tickets are currently being worked on.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="resolved" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {resolvedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {resolvedTickets.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No resolved tickets</h3>
                <p className="text-gray-600">No tickets have been resolved yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="closed" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {closedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {closedTickets.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No closed tickets</h3>
                <p className="text-gray-600">No tickets have been closed yet.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="unassigned" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unassignedTickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            {unassignedTickets.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No unassigned tickets</h3>
                <p className="text-gray-600">All tickets have been assigned to agents.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
