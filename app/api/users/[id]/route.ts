import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { getUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    // Users can view their own profile, admins can view any profile
    if (user.role !== "admin" && user.id !== id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { data: targetUser, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("id", id)
      .single()

    if (error || !targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ user: targetUser })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params
    const { email, full_name, role } = await request.json()

    // Users can update their own profile (except role), admins can update any profile
    if (user.role !== "admin" && user.id !== id) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    // Non-admins cannot change roles
    if (user.role !== "admin" && role !== undefined) {
      return NextResponse.json({ error: "Cannot change role" }, { status: 403 })
    }

    // Validate role if provided
    if (role && !["user", "agent", "admin"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id, email, role").eq("id", id).single()

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const { data: emailCheck } = await supabase.from("users").select("id").eq("email", email).neq("id", id).single()

      if (emailCheck) {
        return NextResponse.json({ error: "Email already taken" }, { status: 400 })
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (email) updateData.email = email
    if (full_name) updateData.full_name = full_name
    if (role && user.role === "admin") updateData.role = role

    // Update user
    const { data: updatedUser, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select("id, email, full_name, role, created_at")
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only admins can delete users
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const { id } = await params

    // Prevent self-deletion
    if (user.id === id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    // Check if user exists
    const { data: existingUser } = await supabase.from("users").select("id, role").eq("id", id).single()

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if user has tickets (optional: you might want to reassign or handle this differently)
    const { data: userTickets } = await supabase
      .from("tickets")
      .select("id")
      .or(`user_id.eq.${id},assigned_agent_id.eq.${id}`)
      .limit(1)

    if (userTickets && userTickets.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete user with associated tickets. Please reassign tickets first.",
        },
        { status: 400 },
      )
    }

    // Delete user
    const { error } = await supabase.from("users").delete().eq("id", id)

    if (error) {
      console.error("Error deleting user:", error)
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
