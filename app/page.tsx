import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth"

export default async function HomePage() {
  const user = await getUser()

  if (user) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}
