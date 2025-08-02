import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only agents and admins can assign tickets
    if (!["agent", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params
    const { assigned_agent_id } = await request.json()

    // Validate that the assigned agent exists and is an agent or admin
    if (assigned_agent_id) {
      const { data: agent, error: agentError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", assigned_agent_id)
        .single()

      if (agentError || !agent || !["agent", "admin"].includes(agent.role)) {
        return NextResponse.json({ error: "Invalid agent selected" }, { status: 400 })
      }
    }

    // Update the ticket
    const { data: ticket, error } = await supabase
      .from("tickets")
      .update({
        assigned_agent_id: assigned_agent_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to assign ticket" }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    console.error("Assignment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
