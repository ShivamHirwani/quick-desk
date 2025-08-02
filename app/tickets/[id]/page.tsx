import { notFound } from "next/navigation"
import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TicketActions } from "@/components/ticket-actions"
import { TicketComments } from "@/components/ticket-comments"
import { ArrowLeft, Calendar, User, Tag, AlertCircle } from "lucide-react"
import Link from "next/link"

interface TicketPageProps {
  params: {
    id: string
  }
}

export default async function TicketPage({ params }: TicketPageProps) {
  const user = await requireAuth()
  const ticketId = params.id

  // Fetch ticket with related data
  const { data: ticket, error } = await supabase
    .from("tickets")
    .select(`
      *,
      categories (id, name, color),
      users!tickets_user_id_fkey (id, full_name, email),
      users!tickets_assigned_agent_id_fkey (id, full_name, email)
    `)
    .eq("id", ticketId)
    .single()

  if (error || !ticket) {
    notFound()
  }

  // Check if user has access to this ticket
  const hasAccess =
    user.role === "admin" || user.role === "agent" || ticket.user_id === user.id || ticket.assigned_agent_id === user.id

  if (!hasAccess) {
    notFound()
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
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/tickets">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Link>
            </Button>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Ticket #{ticket.id.slice(0, 8)}</span>
                <span>Created {new Date(ticket.created_at).toLocaleDateString()}</span>
                {ticket.updated_at !== ticket.created_at && (
                  <span>Updated {new Date(ticket.updated_at).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
              <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
            </div>
          </div>
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
                <div className="whitespace-pre-wrap text-gray-700">{ticket.description}</div>
              </CardContent>
            </Card>

            {/* Comments */}
            <TicketComments ticketId={ticket.id} currentUser={user} ticketStatus={ticket.status} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Ticket Actions */}
            {(user.role === "agent" || user.role === "admin") && <TicketActions ticket={ticket} />}

            {/* Ticket Details */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created by</p>
                    <p className="text-sm text-gray-600">{ticket.users?.full_name}</p>
                  </div>
                </div>

                {ticket.users && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Assigned to</p>
                      <p className="text-sm text-gray-600">{ticket.users.full_name || "Unassigned"}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Category</p>
                    <p className="text-sm text-gray-600">{ticket.categories?.name || "Uncategorized"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Priority</p>
                    <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-sm text-gray-600">{new Date(ticket.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {ticket.updated_at !== ticket.created_at && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium">Last updated</p>
                      <p className="text-sm text-gray-600">{new Date(ticket.updated_at).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
