import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { TicketActions } from "@/components/ticket-actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Tag, User, Users, ArrowLeft, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

interface TicketDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function TicketDetailPage({ params }: TicketDetailPageProps) {
  try {
    const user = await requireAuth()
    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      console.log("Invalid UUID format:", id)
      notFound()
    }

    // Fetch the ticket with all related data
    const { data: ticket, error: ticketError } = await supabase
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
      .eq("id", id)
      .single()

    if (ticketError) {
      console.error("Ticket fetch error:", ticketError)
      notFound()
    }

    if (!ticket) {
      console.log("No ticket found with ID:", id)
      notFound()
    }

    // Check permissions - users can only view their own tickets, agents/admins can view all
    if (user.role === "user" && ticket.user_id !== user.id) {
      console.log("Permission denied: user trying to access ticket they don't own")
      notFound()
    }

    // Fetch agents list for assignment (only for agents/admins)
    let agents = []
    if (["agent", "admin"].includes(user.role)) {
      const { data: agentsData } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("role", ["agent", "admin"])
        .order("full_name")
      agents = agentsData || []
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

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "open":
          return <AlertCircle className="h-4 w-4" />
        case "in_progress":
          return <Clock className="h-4 w-4" />
        case "resolved":
          return <CheckCircle className="h-4 w-4" />
        case "closed":
          return <XCircle className="h-4 w-4" />
        default:
          return <AlertCircle className="h-4 w-4" />
      }
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
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
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Button asChild variant="outline" size="sm">
                <Link href={user.role === "user" ? "/tickets" : "/tickets/manage"}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tickets
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(ticket.status)} variant="secondary">
                  {getStatusIcon(ticket.status)}
                  <span className="ml-1">{ticket.status.replace("_", " ")}</span>
                </Badge>
                <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                  {ticket.priority} priority
                </Badge>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-gray-600 mt-1">Ticket #{ticket.id.slice(0, 8)}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Ticket Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Comments Section - Placeholder for future implementation */}
              <Card>
                <CardHeader>
                  <CardTitle>Comments</CardTitle>
                  <CardDescription>Communication history for this ticket</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p>No comments yet. Comments feature coming soon!</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Actions - Only for agents/admins */}
              {["agent", "admin"].includes(user.role) && <TicketActions ticket={ticket} user={user} agents={agents} />}

              {/* Ticket Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Status</span>
                    <Badge className={getStatusColor(ticket.status)} variant="secondary">
                      {ticket.status.replace("_", " ")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Priority</span>
                    <Badge className={getPriorityColor(ticket.priority)} variant="outline">
                      {ticket.priority}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Created by</p>
                        <p className="text-sm text-gray-900">{ticket.users?.full_name || "Unknown User"}</p>
                        <p className="text-xs text-gray-500">{ticket.users?.email}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Assigned to</p>
                        <p className="text-sm text-gray-900">{ticket.assigned_agent?.full_name || "Unassigned"}</p>
                        {ticket.assigned_agent?.email && (
                          <p className="text-xs text-gray-500">{ticket.assigned_agent.email}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Tag className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Category</p>
                        <p className="text-sm text-gray-900">{ticket.categories?.name || "Uncategorized"}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-500">Created</p>
                        <p className="text-sm text-gray-900">{formatDate(ticket.created_at)}</p>
                      </div>
                    </div>

                    {ticket.updated_at !== ticket.created_at && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-500">Last updated</p>
                          <p className="text-sm text-gray-900">{formatDate(ticket.updated_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* User Actions - For ticket creators */}
              {user.id === ticket.user_id && !["resolved", "closed"].includes(ticket.status) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                    <CardDescription>Actions you can perform on this ticket</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {ticket.status !== "resolved" && (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        Mark as Resolved
                        <span className="text-xs text-gray-500 ml-2">(Coming soon)</span>
                      </Button>
                    )}
                    {ticket.status !== "closed" && (
                      <Button variant="outline" className="w-full bg-transparent" disabled>
                        Close Ticket
                        <span className="text-xs text-gray-500 ml-2">(Coming soon)</span>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Error in TicketDetailPage:", error)
    notFound()
  }
}
