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
import { ArrowLeft, Loader2, UserPlus } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
  full_name: string
  role: string
}

export default function CreateUserPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "user",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Basic validation
    if (!formData.email || !formData.full_name || !formData.password) {
      setError("All fields are required")
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess("User created successfully!")
        setTimeout(() => {
          router.push("/admin/users")
        }, 2000)
      } else {
        setError(data.error || "Failed to create user")
      }
    } catch (error) {
      console.error("Failed to create user:", error)
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
            <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
            <p className="mt-2 text-gray-600">Add a new user to the system with appropriate role and permissions.</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              User Information
            </CardTitle>
            <CardDescription>Fill in the details for the new user account.</CardDescription>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Enter full name"
                    required
                    disabled={loading}
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={formData.role} onValueChange={(value) => handleChange("role", value)}>
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Enter password (min 6 characters)"
                    required
                    disabled={loading}
                    minLength={6}
                  />
                </div>
              </div>
            </CardContent>

            <div className="flex justify-end gap-4 p-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create User
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  )
}
