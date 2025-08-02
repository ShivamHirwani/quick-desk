"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Ticket,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  X,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

interface Category {
  id: string
  name: string
  color: string
}

interface TicketData {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  created_at: string
  updated_at: string
  categories: Category | null
}

export default function MyTicketsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL params
  useEffect(() => {
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || "all"
    const category = searchParams.get("category") || "all"
    const priority = searchParams.get("priority") || "all"
    const sort = searchParams.get("sort") || "created_at"
    const direction = (searchParams.get("direction") as "asc" | "desc") || "desc"

    setSearchQuery(search)
    setStatusFilter(status)
    setCategoryFilter(category)
    setPriorityFilter(priority)
    setSortBy(sort)
    setSortDirection(direction)
  }, [searchParams])

  // Update URL when filters change
  const updateURL = (filters: Record<string, string>) => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value)
      }
    })
    const newURL = params.toString() ? `?${params.toString()}` : "/tickets"
    router.replace(newURL, { scroll: false })
  }

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [userRes, ticketsRes, categoriesRes] = await Promise.all([
          fetch("/api/user"),
          fetch("/api/tickets"),
          fetch("/api/categories"),
        ])

        if (userRes.ok) {
          const userData = await userRes.json()
          setUser(userData.user)
        } else {
          router.push("/login")
          return
        }

        if (ticketsRes.ok) {
          const ticketsData = await ticketsRes.json()
          setTickets(ticketsData.tickets || [])
        }

        if (categoriesRes.ok) {
          const categoriesData = await categoriesRes.json()
          setCategories(categoriesData.categories || [])
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
        setError("Failed to load tickets")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // Filter and sort tickets
  const filteredAndSortedTickets = useMemo(() => {
    const filtered = tickets.filter((ticket) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        if (!ticket.subject.toLowerCase().includes(query) && !ticket.description.toLowerCase().includes(query)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) {
        return false
      }

      // Category filter
      if (categoryFilter !== "all" && ticket.categories?.id !== categoryFilter) {
        return false
      }

      // Priority filter
      if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
        return false
      }

      return true
    })

    // Sort tickets
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof TicketData]
      let bValue: any = b[sortBy as keyof TicketData]

      if (sortBy === "created_at" || sortBy === "updated_at") {
        aValue = new Date(aValue).getTime()
        bValue = new Date(bValue).getTime()
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    return filtered
  }, [tickets, searchQuery, statusFilter, categoryFilter, priorityFilter, sortBy, sortDirection])

  // Handle filter changes
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateURL({
      search: value,
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      sort: sortBy,
      direction: sortDirection,
    })
  }

  const handleFilterChange = (type: string, value: string) => {
    const updates: Record<string, string> = {
      search: searchQuery,
      status: statusFilter,
      category: categoryFilter,
      priority: priorityFilter,
      sort: sortBy,
      direction: sortDirection,
    }
    updates[type] = value

    switch (type) {
      case "status":
        setStatusFilter(value)
        break
      case "category":
        setCategoryFilter(value)
        break
      case "priority":
        setPriorityFilter(value)
        break
      case "sort":
        setSortBy(value)
        break
      case "direction":
        setSortDirection(value as "asc" | "desc")
        break
    }

    updateURL(updates)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
    setPriorityFilter("all")
    setSortBy("created_at")
    setSortDirection("desc")
    router.replace("/tickets", { scroll: false })
  }

  const toggleSortDirection = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc"
    handleFilterChange("direction", newDirection)
  }

  // Calculate statistics
  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    in_progress: tickets.filter((t) => t.status === "in_progress").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed").length,
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
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const hasActiveFilters = searchQuery || statusFilter !== "all" || categoryFilter !== "all" || priorityFilter !== "all"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Tickets</h1>
              <p className="mt-2 text-gray-600">
                Manage and track your support requests ({filteredAndSortedTickets.length} of {tickets.length} tickets)
              </p>
            </div>
            <Button asChild>
              <Link href="/tickets/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Ticket
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets by subject or description..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select value={statusFilter} onValueChange={(value) => handleFilterChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={(value) => handleFilterChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={(value) => handleFilterChange("priority", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value) => handleFilterChange("sort", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Created Date</SelectItem>
                  <SelectItem value="updated_at">Updated Date</SelectItem>
                  <SelectItem value="subject">Subject</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={toggleSortDirection} className="flex-1 bg-transparent">
                  {sortDirection === "asc" ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {sortDirection === "asc" ? "Asc" : "Desc"}
                </Button>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <span className="text-sm font-medium text-gray-500">Active filters:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Search: "{searchQuery}"
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleSearchChange("")} />
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {statusFilter.replace("_", " ")}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("status", "all")} />
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categories.find((c) => c.id === categoryFilter)?.name}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("category", "all")} />
                  </Badge>
                )}
                {priorityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {priorityFilter}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => handleFilterChange("priority", "all")} />
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="pt-6">
              <div className="text-red-600">{error}</div>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
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
        </div>

        {/* Tickets List */}
        {filteredAndSortedTickets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedTickets.map((ticket) => (
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
                      <span>{ticket.categories?.name || "Uncategorized"}</span>
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/tickets/${ticket.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {hasActiveFilters ? "No tickets match your filters" : "No tickets yet"}
              </h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters
                  ? "Try adjusting your search criteria or clearing filters."
                  : "Create your first support ticket to get started."}
              </p>
              {hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/tickets/new">Create Ticket</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
