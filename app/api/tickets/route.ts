import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { subject, description, category_id, priority } = await request.json()

    const { data: ticket, error } = await supabase
      .from("tickets")
      .insert({
        subject,
        description,
        category_id: category_id || null,
        priority,
        user_id: user.id,
        status: "open",
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 })
    }

    return NextResponse.json({ ticket })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const sort = searchParams.get("sort") || "created_at"
    const order = searchParams.get("order") || "desc"

    let query = supabase.from("tickets").select(`
        *,
        categories (name, color),
        users!tickets_assigned_agent_id_fkey (full_name)
      `)

    // Filter by user's own tickets unless they're an agent/admin
    if (user.role === "user") {
      query = query.eq("user_id", user.id)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (category) {
      query = query.eq("category_id", category)
    }

    if (search) {
      query = query.or(`subject.ilike.%${search}%,description.ilike.%${search}%`)
    }

    query = query.order(sort, { ascending: order === "asc" })

    const { data: tickets, error } = await query

    if (error) {
      return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
