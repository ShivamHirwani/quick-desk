import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only admins can perform bulk operations
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { action, userIds, data } = await request.json()

    if (!action || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    // Prevent operations on self
    if (userIds.includes(user.id)) {
      return NextResponse.json({ error: "Cannot perform bulk operations on your own account" }, { status: 400 })
    }

    let result
    switch (action) {
      case "delete":
        // Check for tickets before deletion
        const { data: ticketsCheck } = await supabase
          .from("tickets")
          .select("id")
          .or(userIds.map((id) => `user_id.eq.${id},assigned_agent_id.eq.${id}`).join(","))
          .limit(1)

        if (ticketsCheck && ticketsCheck.length > 0) {
          return NextResponse.json(
            {
              error: "Cannot delete users with associated tickets. Please reassign tickets first.",
            },
            { status: 400 },
          )
        }

        const { error: deleteError } = await supabase.from("users").delete().in("id", userIds)

        if (deleteError) {
          return NextResponse.json({ error: "Failed to delete users" }, { status: 500 })
        }

        result = { message: `Successfully deleted ${userIds.length} users` }
        break

      case "updateRole":
        if (!data?.role || !["user", "agent", "admin"].includes(data.role)) {
          return NextResponse.json({ error: "Invalid role" }, { status: 400 })
        }

        const { error: updateError } = await supabase
          .from("users")
          .update({
            role: data.role,
            updated_at: new Date().toISOString(),
          })
          .in("id", userIds)

        if (updateError) {
          return NextResponse.json({ error: "Failed to update user roles" }, { status: 500 })
        }

        result = { message: `Successfully updated role for ${userIds.length} users` }
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Bulk operation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
