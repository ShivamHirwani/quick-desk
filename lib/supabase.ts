import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          password_hash: string
          full_name: string
          role: "user" | "agent" | "admin"
          created_at: string
          updated_at: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          created_at: string
        }
      }
      tickets: {
        Row: {
          id: string
          subject: string
          description: string
          status: "open" | "in_progress" | "resolved" | "closed"
          priority: "low" | "medium" | "high" | "urgent"
          category_id: string | null
          user_id: string
          assigned_agent_id: string | null
          attachment_url: string | null
          upvotes: number
          downvotes: number
          created_at: string
          updated_at: string
        }
      }
      ticket_comments: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          comment: string
          is_internal: boolean
          created_at: string
        }
      }
      ticket_votes: {
        Row: {
          id: string
          ticket_id: string
          user_id: string
          vote_type: "upvote" | "downvote"
          created_at: string
        }
      }
    }
  }
}
