"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { MessageCircle, Lock, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Comment {
  id: string
  content: string
  is_internal: boolean
  created_at: string
  users: {
    id: string
    full_name: string
    email: string
    role: string
  }
}

interface TicketCommentsProps {
  ticketId: string
  currentUser: {
    id: string
    full_name: string
    email: string
    role: string
  }
  ticketStatus: string
}

export function TicketComments({ ticketId, currentUser, ticketStatus }: TicketCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isInternal, setIsInternal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()

  const canCreateInternalComments = currentUser.role === "agent" || currentUser.role === "admin"
  const canComment = ticketStatus !== "closed" || currentUser.role !== "user"

  useEffect(() => {
    fetchComments()
  }, [ticketId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to load comments",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching comments:", error)
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) {
      toast({
        title: "Error",
        description: "Please enter a comment",
        variant: "destructive",
      })
      return
    }

    if (newComment.length > 5000) {
      toast({
        title: "Error",
        description: "Comment is too long (max 5000 characters)",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment.trim(),
          is_internal: isInternal,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setComments((prev) => [...prev, data.comment])
        setNewComment("")
        setIsInternal(false)
        toast({
          title: "Success",
          description: "Comment added successfully",
        })
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to add comment",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding comment:", error)
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return date.toLocaleDateString()
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800"
      case "agent":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading comments...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comments List */}
        {comments.length > 0 ? (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <Avatar className="h-8 w-8 shrink-0">
                  <AvatarFallback className="text-xs">{getInitials(comment.users.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{comment.users.full_name}</span>
                    {comment.users.role !== "user" && (
                      <Badge className={getRoleBadgeColor(comment.users.role)} variant="secondary">
                        {comment.users.role}
                      </Badge>
                    )}
                    {comment.is_internal && (
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        <Lock className="h-3 w-3 mr-1" />
                        Internal
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">{formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap break-words">{comment.content}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No comments yet</p>
            <p className="text-sm">Be the first to add a comment!</p>
          </div>
        )}

        {/* Add Comment Form */}
        {canComment && (
          <form onSubmit={handleSubmitComment} className="space-y-4 pt-4 border-t">
            <div>
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] resize-none"
                maxLength={5000}
                disabled={submitting}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-gray-500">{newComment.length}/5000 characters</span>
                {newComment.length > 4500 && (
                  <span className="text-xs text-orange-600">{5000 - newComment.length} characters remaining</span>
                )}
              </div>
            </div>

            {canCreateInternalComments && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="internal-comment"
                  checked={isInternal}
                  onCheckedChange={setIsInternal}
                  disabled={submitting}
                />
                <Label htmlFor="internal-comment" className="text-sm">
                  Internal comment (only visible to agents and admins)
                </Label>
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={!newComment.trim() || submitting} className="min-w-[100px]">
                {submitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Add Comment
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {!canComment && (
          <div className="pt-4 border-t">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <Send className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Comments are disabled for closed tickets</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
