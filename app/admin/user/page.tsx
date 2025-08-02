"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Users, Search, Plus, Edit, Trash2, ArrowLeft, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  full_name: string
  role: "user" | "agent" | "admin"
  created_at: string
}

export default function UsersManagementPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Filters and pagination
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [bulkAction, setBulkAction] = useState("")
  const [bulkLoading, setBulkLoading] = useState(false)

  const router = useRouter()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [searchQuery, roleFilter, currentPage])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
      router.push("/login")
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        role: roleFilter,
        page: currentPage.toString(),
        limit: "10",
      })

      const response = await fetch(`/api/users?${params}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
        setTotalUsers(data.total)
        setTotalPages(data.totalPages)
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to fetch users")
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
      setError("Failed to fetch users")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        fetchUsers()
        setSelectedUsers((prev) => prev.filter((id) => id !== userId))
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Failed to delete user")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      setError("Failed to delete user")
    }
  }

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) return

    try {
      setBulkLoading(true)
      const requestData: any = {
        action: bulkAction,
        userIds: selectedUsers,
      }

      if (bulkAction === "updateRole") {
        const role = prompt("Enter new role (user, agent, admin):")
        if (!role || !["user", "agent", "admin"].includes(role)) {
          setError("Invalid role")
          return
        }
        requestData.data = { role }
      }

      const response = await fetch("/api/users/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        fetchUsers()
        setSelectedUsers([])
        setBulkAction("")
      } else {
        const errorData = await response.json()
        setError(errorData.error || "Bulk operation failed")
      }
    } catch (error) {
      console.error("Bulk operation failed:", error)
      setError("Bulk operation failed")
    } finally {
      setBulkLoading(false)
    }
  }

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]))
  }

  const toggleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(users.map((user) => user.id))
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "agent":
        return "bg-blue-100 text-blue-800"
      case "user":
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
    })
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Link>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="mt-2 text-gray-600">Manage users, roles, and permissions ({totalUsers} total users)</p>
            </div>
            <Button asChild>
              <Link href="/admin/users/new">
                <Plus className="h-4 w-4 mr-2" />
                Create User
              </Link>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="user">Users</SelectItem>
                  <SelectItem value="agent">Agents</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex gap-2">
                <Select value={bulkAction} onValueChange={setBulkAction}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bulk actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="updateRole">Update Role</SelectItem>
                    <SelectItem value="delete">Delete Users</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleBulkAction}
                  disabled={!bulkAction || selectedUsers.length === 0 || bulkLoading}
                  variant="outline"
                >
                  {bulkLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
                </Button>
              </div>
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Badge variant="secondary">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? "s" : ""} selected
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => setSelectedUsers([])}>
                  Clear selection
                </Button>
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

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Users</span>
              {users.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox checked={selectedUsers.length === users.length} onCheckedChange={toggleSelectAll} />
                  <span className="text-sm text-gray-500">Select all</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : users.length > 0 ? (
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={selectedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                        disabled={user.id === currentUser.id}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                          <Badge className={getRoleColor(user.role)} variant="secondary">
                            {user.role}
                          </Badge>
                          {user.id === currentUser.id && <Badge variant="outline">You</Badge>}
                        </div>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">Created {formatDate(user.created_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Edit className="h-4 w-4" />
                        </Link>
                      </Button>

                      {user.id !== currentUser.id && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 bg-transparent"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete User</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete {user.full_name}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteUser(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">No users match your current filters.</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * 10 + 1} to {Math.min(currentPage * 10, totalUsers)} of {totalUsers} users
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
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
