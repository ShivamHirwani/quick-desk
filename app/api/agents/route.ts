import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only agents and admins can view the agents list
    if (!["agent", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: agents, error } = await supabase
      .from("users")
      .select("id, full_name, email")
      .in("role", ["agent", "admin"])
      .order("full_name")

    if (error) {
      return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
    }

    return NextResponse.json({ agents })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
