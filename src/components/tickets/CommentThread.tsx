import { useState } from 'react'
import { motion } from 'framer-motion'
import { Send, Reply, UserCircle } from 'lucide-react'
import type { Comment, AddCommentPayload } from '../../lib/types'
import Spinner from '../ui/Spinner'

interface CommentThreadProps {
  comments: Comment[]
  onAddComment: (payload: AddCommentPayload) => Promise<void>
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment
  onReply: (parentId: number) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand/60 to-amber/60 text-[10px] font-bold text-paper">
        {comment.userName
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) ?? <UserCircle className="size-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-paper">
            {comment.userName}
          </span>
          <span className="text-[11px] text-paper-muted">
            {new Date(comment.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-paper/90">
          {comment.content}
        </p>
        <button
          type="button"
          onClick={() => onReply(comment.id)}
          className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-paper-muted transition-colors hover:text-brand"
        >
          <Reply className="size-3" />
          Reply
        </button>

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-l-2 border-line pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default function CommentThread({
  comments,
  onAddComment,
}: CommentThreadProps) {
  const [content, setContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!content.trim()) return
    setLoading(true)
    try {
      await onAddComment({
        content: content.trim(),
        parentCommentId: replyTo,
      })
      setContent('')
      setReplyTo(null)
    } finally {
      setLoading(false)
    }
  }

  function handleReply(parentId: number) {
    setReplyTo(parentId)
    // Focus the input
    document.getElementById('comment-input')?.focus()
  }

  return (
    <div className="space-y-5">
      {/* Comment list */}
      <div className="flex flex-col gap-4">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-paper-muted">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} onReply={handleReply} />
          ))
        )}
      </div>

      {/* Add comment */}
      <div className="border-t border-line pt-4">
        {replyTo && (
          <div className="mb-2 flex items-center gap-2 text-xs text-paper-muted">
            <Reply className="size-3" />
            Replying to comment #{replyTo}
            <button
              type="button"
              onClick={() => setReplyTo(null)}
              className="font-medium text-red-400 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            id="comment-input"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write a comment…"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-line bg-ink/60 px-4 py-3 text-sm text-paper outline-none placeholder:text-paper-muted/60 focus:border-brand focus:shadow-[0_0_0_4px_rgba(228,55,28,0.15)]"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit()
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={loading || !content.trim()}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-paper transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
          >
            {loading ? <Spinner size="sm" /> : <Send className="size-4" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-paper-muted">
          Press Ctrl+Enter to send
        </p>
      </div>
    </div>
  )
}
