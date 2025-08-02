import { requireAuth } from "@/lib/auth"
import { supabase } from "@/lib/supabase"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Ticket, Plus, Search } from "lucide-react"
import Link from "next/link"

export default async function TicketsPage() {
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

  // Fetch categories for filter
  const { data: categories } = await supabase.from("categories").select("*").order("name")

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tickets</h1>
              <p className="text-gray-600">View and manage your support tickets</p>
            </div>
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="mr-2 h-4 w-4" />
                New Ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input placeholder="Search tickets..." className="pl-10" disabled />
                </div>
              </div>
              <Select disabled>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select disabled>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500 mt-2">Search and filter functionality will be available soon.</p>
          </CardContent>
        </Card>

        {/* Tickets List */}
        {tickets && tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket: any) => (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-lg">{ticket.subject}</h3>
                        <Badge className={getStatusColor(ticket.status)}>{ticket.status.replace("_", " ")}</Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ticket.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>#{ticket.id.slice(0, 8)}</span>
                        <span>Category: {ticket.categories?.name || "Uncategorized"}</span>
                        <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                        {ticket.users?.full_name && <span>Assigned to: {ticket.users.full_name}</span>}
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/tickets/${ticket.id}`}>View</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
