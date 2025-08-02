import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const ticketId = params.id

    // First, check if user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("user_id, assigned_agent_id")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check permissions
    const hasAccess =
      user.role === "admin" ||
      user.role === "agent" ||
      ticket.user_id === user.id ||
      ticket.assigned_agent_id === user.id

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Fetch comments with user information
    let query = supabase
      .from("ticket_comments")
      .select(`
        *,
        users (id, full_name, email, role)
      `)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })

    // Filter internal comments for regular users
    if (user.role === "user") {
      query = query.eq("is_internal", false)
    }

    const { data: comments, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
    }

    return NextResponse.json({ comments })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const ticketId = params.id
    const { content, is_internal = false } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

    if (content.length > 5000) {
      return NextResponse.json({ error: "Comment is too long (max 5000 characters)" }, { status: 400 })
    }

    // Check if user has access to this ticket
    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .select("user_id, assigned_agent_id, status")
      .eq("id", ticketId)
      .single()

    if (ticketError || !ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Check permissions
    const hasAccess =
      user.role === "admin" ||
      user.role === "agent" ||
      ticket.user_id === user.id ||
      ticket.assigned_agent_id === user.id

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Regular users can't comment on closed tickets
    if (user.role === "user" && ticket.status === "closed") {
      return NextResponse.json({ error: "Cannot comment on closed tickets" }, { status: 403 })
    }

    // Only agents and admins can create internal comments
    const finalIsInternal = user.role === "agent" || user.role === "admin" ? is_internal : false

    // Create the comment
    const { data: comment, error } = await supabase
      .from("ticket_comments")
      .insert({
        ticket_id: ticketId,
        user_id: user.id,
        content: content.trim(),
        is_internal: finalIsInternal,
      })
      .select(`
        *,
        users (id, full_name, email, role)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
    }

    // Update ticket's updated_at timestamp
    await supabase.from("tickets").update({ updated_at: new Date().toISOString() }).eq("id", ticketId)

    return NextResponse.json({ comment })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
