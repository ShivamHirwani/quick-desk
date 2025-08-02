import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { fullName, email, password } = await request.json()

    // Check if user already exists
    const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // In a real app, hash the password properly
    const { data: user, error } = await supabase
      .from("users")
      .insert({
        full_name: fullName,
        email,
        password_hash: password, // This should be hashed
        role: "user",
      })
      .select("id, email, full_name, role")
      .single()

    if (error) {
      return NextResponse.json({ error: "Registration failed" }, { status: 400 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
