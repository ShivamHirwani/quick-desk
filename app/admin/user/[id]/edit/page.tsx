"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, Loader2, Save } from "lucide-react"
import Link from "next/link"

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const [currentUser, setCurrentUser] = useState<any | null>(null)
  const [targetUser, setTargetUser] = useState<any | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "user",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const userId = params.id

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchTargetUser()
    }
  }, [currentUser, userId])

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch("/api/user")
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)

        // Check if user is admin
        if (data.user.role !== "admin") {
          router.push("/dashboard")
        }
      } else {
        router.push("/login")
      }
    } catch (error) {
      console.error("Failed to fetch current user:", error)
      router.push("/login")
    }
  }

  const fetchTargetUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/users/${userId}`)

      if (response.ok) {
        const data = await response.json()
        setTargetUser(data.user)
        setFormData({
          email: data.user.email,
          full_name: data.user.full_name,
          role: data.user.role,
        })
      } else {
        setError("User not found")
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setError("Failed to load user data")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!formData.email || !formData.full_name) {
      setError("Email and full name are required")
      setSaving(false)
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("User updated successfully!")
        setTargetUser(data.user)
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        setError(data.error || "Failed to update user")
      }
    } catch (error) {
      console.error("Failed to update user:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} />
        <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <img src="/user-icon.png" alt="User" className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">User not found</h3>
              <p className="text-gray-600 mb-4">The user you're looking for doesn't exist.</p>
              <Button asChild>
                <Link href="/admin/users">Back to Users</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />

      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Users
              </Link>
            </Button>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit User</h1>
            <p className="mt-2 text-gray-600">Update user information and permissions for {targetUser.full_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <img src="/user-icon.png" alt="User" className="h-5 w-5" />
                  User Information
                </CardTitle>
                <CardDescription>Update the user's profile information and role.</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50">
                      <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange("full_name", e.target.value)}
                      placeholder="Enter full name"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder="Enter email address"
                      required
                      disabled={saving}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => handleChange("role", value)}
                      disabled={saving || targetUser.id === currentUser.id}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      {formData.role === "user" && "Can create and manage their own tickets"}
                      {formData.role === "agent" && "Can manage tickets and assist users"}
                      {formData.role === "admin" && "Full system access and user management"}
                    </p>
                    {targetUser.id === currentUser.id && (
                      <p className="text-xs text-amber-600">You cannot change your own role</p>
                    )}
                  </div>
                </CardContent>

                <div className="flex justify-end gap-4 p-6 border-t">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={saving}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </div>

          {/* User Details Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>User Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">User ID</p>
                  <p className="text-sm text-gray-900 font-mono">{targetUser.id.slice(0, 8)}...</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">{formatDate(targetUser.created_at)}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500">Current Role</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        targetUser.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : targetUser.role === "agent"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {targetUser.role}
                    </span>
                    {targetUser.id === currentUser.id && <span className="text-xs text-gray-500">(You)</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
