import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  MessageSquare,
  Lock,
  Sparkles,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
} from 'lucide-react'
import type { Comment } from '../../lib/types'
import { useAuth } from '../../context/AuthContext'
import { TicketChatService, type RealtimeChatMessage } from '../../lib/ticketChatService'
import Spinner from '../ui/Spinner'

interface CommentThreadProps {
  ticketId?: number
  comments: Comment[]
  onAddComment: (payload: { message: string; content?: string }) => Promise<void>
  readOnly?: boolean
  onRealtimeMessage?: (msg: RealtimeChatMessage) => void
}

export default function CommentThread({
  ticketId,
  comments,
  onAddComment,
  readOnly = false,
  onRealtimeMessage,
}: CommentThreadProps) {
  const { user } = useAuth()
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom of chat
  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  useEffect(() => {
    scrollToBottom(false)
  }, [comments.length, scrollToBottom])

  // Setup SignalR Real-Time connection
  useEffect(() => {
    if (!ticketId) return
    const token = localStorage.getItem('t_token') || ''
    if (!token) return

    const chatService = new TicketChatService(token)

    chatService
      .connect(ticketId, (newMsg: RealtimeChatMessage) => {
        setIsConnected(true)
        if (onRealtimeMessage) {
          onRealtimeMessage(newMsg)
        }
        scrollToBottom(true)
      })
      .then((connected) => {
        setIsConnected(connected)
      })

    return () => {
      chatService.disconnect(ticketId)
      setIsConnected(false)
    }
  }, [ticketId, onRealtimeMessage, scrollToBottom])

  // Auto-grow textarea height
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140,
      )}px`
    }
  }

  // Handle send message
  const handleSend = async () => {
    const trimmed = message.trim()
    if (!trimmed || sending || readOnly) return

    setSending(true)
    try {
      await onAddComment({
        message: trimmed,
        content: trimmed,
      })
      setMessage('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setTimeout(() => scrollToBottom(true), 100)
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const currentUserName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim().toLowerCase()
    : ''
  const currentUserEmail = user?.email?.toLowerCase().trim() || ''

  return (
    <div className="flex flex-col rounded-3xl border border-line bg-ink-soft overflow-hidden shadow-xl shadow-ink/40">
      {/* ─── Chat Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-line px-5 py-4 bg-ink/30 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-brand/15 text-brand shadow-sm">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-paper">
                Ticket Chat
              </h2>
              <span className="rounded-full bg-line px-2 py-0.5 text-[11px] font-semibold text-paper-muted">
                {comments.length}
              </span>
            </div>
            <p className="text-[11px] text-paper-muted">
              Live discussion and activity feed for this ticket
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-1 text-[11px] font-medium text-paper-muted">
              <Radio className="size-3 opacity-60" />
              Chat
            </span>
          )}
          {readOnly && (
            <span className="inline-flex items-center gap-1 rounded-full bg-line border border-line px-2.5 py-1 text-[11px] font-semibold text-paper-muted">
              <Lock className="size-3" />
              Read-only
            </span>
          )}
        </div>
      </div>

      {/* ─── Messages List ────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 p-5 max-h-[520px] min-h-[220px] overflow-y-auto crazy-chat-scroll">
        {comments.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-line text-paper-muted">
              <MessageSquare className="size-6" />
            </div>
            <p className="text-sm font-semibold text-paper">No chat messages yet</p>
            <p className="mt-1 max-w-xs text-xs text-paper-muted leading-relaxed">
              {readOnly
                ? 'There are no messages recorded for this ticket.'
                : 'Send a message below to start the conversation with your team.'}
            </p>
          </div>
        ) : (
          comments.map((comment, index) => {
            const commentMsg = comment.message || comment.content || ''
            const authorName = comment.userName || 'Team Member'
            const authorLower = authorName.toLowerCase().trim()
            const isSelf =
              (currentUserName && authorLower === currentUserName) ||
              (currentUserEmail &&
                comment.userEmail &&
                comment.userEmail.toLowerCase().trim() === currentUserEmail)

            // Detect special system comments
            const isReview =
              commentMsg.includes('Completion Review') ||
              commentMsg.startsWith('📋') ||
              (comment as { commentType?: string }).commentType === 'Approved'
            const isRejection =
              commentMsg.includes('Assignment Rejected') ||
              commentMsg.includes('Changes Requested') ||
              commentMsg.startsWith('❌') ||
              commentMsg.startsWith('⚠️') ||
              (comment as { commentType?: string }).commentType === 'Rejected'

            const initials = authorName
              .split(' ')
              .map((p) => p[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase() || 'U'

            return (
              <motion.div
                key={comment.id || `comment-${index}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${
                  isSelf ? 'flex-row-reverse self-end max-w-[85%]' : 'max-w-[85%]'
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex size-8 shrink-0 select-none items-center justify-center rounded-2xl text-[11px] font-bold shadow-sm ${
                    isSelf
                      ? 'bg-gradient-to-tr from-brand to-cyan-500 text-paper'
                      : isReview
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isRejection
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-ink border border-line text-paper-muted'
                  }`}
                  title={authorName}
                >
                  {isReview ? (
                    <CheckCircle2 className="size-4" />
                  ) : isRejection ? (
                    <XCircle className="size-4" />
                  ) : (
                    initials
                  )}
                </div>

                {/* Message Bubble */}
                <div className="flex flex-col min-w-0">
                  {/* Meta header */}
                  <div
                    className={`flex items-center gap-2 mb-1 px-1 text-[11px] ${
                      isSelf ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <span className="font-semibold text-paper truncate max-w-[150px]">
                      {isSelf ? 'You' : authorName}
                    </span>
                    {isReview && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                        Review
                      </span>
                    )}
                    {isRejection && (
                      <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-400">
                        Rejected
                      </span>
                    )}
                    <span className="text-paper-muted/70 text-[10px]">
                      {comment.createdAt
                        ? new Date(comment.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>

                  {/* Bubble Content */}
                  <div
                    className={`relative rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm break-words ${
                      isSelf
                        ? 'bg-brand text-paper rounded-tr-xs'
                        : isReview
                        ? 'border border-emerald-500/30 bg-emerald-950/20 text-emerald-100 rounded-tl-xs'
                        : isRejection
                        ? 'border border-red-500/30 bg-red-950/20 text-red-100 rounded-tl-xs'
                        : 'border border-line bg-ink/70 text-paper/90 rounded-tl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{commentMsg}</p>
                  </div>

                  {/* Full Date on hover or subtle text */}
                  {comment.createdAt && (
                    <span
                      className={`mt-0.5 px-1 text-[9px] text-paper-muted/50 ${
                        isSelf ? 'text-right' : ''
                      }`}
                    >
                      {new Date(comment.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </motion.div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ─── Chat Input Bar ───────────────────────────────────────────────────── */}
      {readOnly ? (
        <div className="border-t border-line bg-ink/60 px-5 py-3.5 text-center text-xs text-paper-muted flex items-center justify-center gap-2">
          <Lock className="size-3.5 text-paper-muted/70" />
          <span>This ticket is finalized and archived. Chat is in read-only mode.</span>
        </div>
      ) : (
        <div className="border-t border-line bg-ink/40 p-4">
          <div className="flex items-end gap-2.5 rounded-2xl border border-line bg-ink/70 p-2 focus-within:border-brand focus-within:shadow-[0_0_0_2px_rgba(59,130,246,0.2)] transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message… (Press Enter to send, Shift+Enter for newline)"
              className="flex-1 resize-none bg-transparent px-3 py-2 text-sm text-paper placeholder:text-paper-muted/50 outline-none max-h-36 overflow-y-auto"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!message.trim() || sending}
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand text-paper shadow-md shadow-brand/30 transition-all hover:scale-105 active:scale-95 disabled:pointer-events-none disabled:opacity-40 cursor-pointer"
              title="Send message (Enter)"
            >
              {sending ? <Spinner size="sm" /> : <Send className="size-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between px-1 text-[11px] text-paper-muted">
            <span className="flex items-center gap-1 text-[10px]">
              <Sparkles className="size-3 text-brand" />
              Real-time updates enabled
            </span>
            <span className="text-[10px]">Enter ↵ to send</span>
          </div>
        </div>
      )}
    </div>
  )
}
