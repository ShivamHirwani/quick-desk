"use client"
// this is navbar
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { LogOut } from "lucide-react"
import type { User as UserType } from "@/lib/auth"

interface NavbarProps {
  user: UserType
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800"
      case "agent":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <nav className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="text-xl font-bold text-gray-900">
              QuickDesk
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              <Link href="/dashboard" className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                Dashboard
              </Link>
              <Link href="/tickets" className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                My Tickets
              </Link>
              <Link href="/tickets/new" className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                New Ticket
              </Link>
              {(user.role === "agent" || user.role === "admin") && (
                <Link href="/agent" className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Agent Panel
                </Link>
              )}
              {user.role === "admin" && (
                <Link href="/admin" className="text-gray-900 hover:text-gray-700 px-3 py-2 text-sm font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Badge className={getRoleColor(user.role)}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.full_name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium">{user.full_name}</p>
                    <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <DropdownMenuItem onClick={handleLogout} disabled={loading}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  )
}
