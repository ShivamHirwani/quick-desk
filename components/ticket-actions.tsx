"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, AlertCircle } from "lucide-react"

interface TicketActionsProps {
  ticket: {
    id: string
    status: string
    priority: string
    assigned_agent_id: string | null
  }
  user: {
    id: string
    role: string
  }
  agents?: Array<{
    id: string
    full_name: string
    email: string
  }>
}

export function TicketActions({ ticket, user, agents = [] }: TicketActionsProps) {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        toast({
          title: "Status updated",
          description: `Ticket status changed to ${newStatus.replace("_", " ")}`,
        })
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update status",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleAssignment = async (agentId: string) => {
    setIsAssigning(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assigned_agent_id: agentId || null }),
      })

      if (response.ok) {
        const agent = agents.find((a) => a.id === agentId)
        toast({
          title: "Assignment updated",
          description: agentId ? `Ticket assigned to ${agent?.full_name}` : "Ticket unassigned",
        })
        router.refresh()
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to update assignment",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update assignment",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  // Only agents and admins can see this component
  if (!["agent", "admin"].includes(user.role)) {
    return null
  }

  const statusOptions = [
    { value: "open", label: "Open", color: "bg-red-100 text-red-800" },
    { value: "in_progress", label: "In Progress", color: "bg-yellow-100 text-yellow-800" },
    { value: "resolved", label: "Resolved", color: "bg-green-100 text-green-800" },
    { value: "closed", label: "Closed", color: "bg-gray-100 text-gray-800" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Actions</CardTitle>
        <CardDescription>Manage this ticket's status and assignment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Update */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Update Status</label>
          <div className="grid grid-cols-2 gap-2">
            {statusOptions.map((status) => (
              <Button
                key={status.value}
                variant={ticket.status === status.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusUpdate(status.value)}
                disabled={isUpdatingStatus || ticket.status === status.value}
                className="justify-start"
              >
                {isUpdatingStatus ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="h-4 w-4 mr-2" />
                )}
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Assign Agent</label>
          <Select
            value={ticket.assigned_agent_id || "unassigned"}
            onValueChange={(value) => handleAssignment(value === "unassigned" ? "" : value)}
            disabled={isAssigning}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an agent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  Unassigned
                </div>
              </SelectItem>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2 text-blue-500" />
                    <div>
                      <div className="font-medium">{agent.full_name}</div>
                      <div className="text-xs text-gray-500">{agent.email}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAssigning && (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating assignment...
            </div>
          )}
        </div>

        {/* Current Assignment Display */}
        {ticket.assigned_agent_id && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <User className="h-4 w-4 text-blue-500 mr-2" />
              <div>
                <p className="text-sm font-medium text-blue-900">Currently Assigned</p>
                <p className="text-xs text-blue-700">
                  {agents.find((a) => a.id === ticket.assigned_agent_id)?.full_name || "Unknown Agent"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
