import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const { status } = await request.json()

    // Validate status
    const validStatuses = ["open", "in_progress", "resolved", "closed"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Check permissions
    const { data: ticket } = await supabase.from("tickets").select("user_id, assigned_agent_id").eq("id", id).single()

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Users can only update their own tickets to limited statuses
    if (user.role === "user") {
      if (ticket.user_id !== user.id) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
      // Users can only close their own tickets or mark as resolved
      if (!["resolved", "closed"].includes(status)) {
        return NextResponse.json({ error: "Users can only resolve or close tickets" }, { status: 403 })
      }
    }

    // Agents can update tickets assigned to them or any ticket
    // Admins can update any ticket

    // Update the ticket
    const { data: updatedTicket, error } = await supabase
      .from("tickets")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update ticket status" }, { status: 500 })
    }

    return NextResponse.json({ ticket: updatedTicket })
  } catch (error) {
    console.error("Status update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
