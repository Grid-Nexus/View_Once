'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSent: () => void
}

export default function NewMessageModal({ isOpen, onClose, onSent }: Props) {
  const [recipientEmail, setRecipientEmail] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  async function handleSend() {
    setLoading(true)
    setError('')

    // Input validation
    if (content.length > 2000) {
      setError('Message too long. Max 2000 characters.')
      setLoading(false)
      return
    }

    if (recipientEmail.length > 254) {
      setError('Invalid email address.')
      setLoading(false)
      return
    }

    // Get logged in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setError('You must be logged in')
      setLoading(false)
      return
    }

    // Find recipient by email
    const { data: recipient, error: recipientError } = await supabase
      .from('users')
      .select('id')
      .eq('email', recipientEmail)
      .single()

    if (recipientError || !recipient) {
      setError('User not found. They must have an account first.')
      setLoading(false)
      return
    }

    // Encode message content before saving
    const encoded = btoa(unescape(encodeURIComponent(content)))

    // Save message
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: recipient.id,
        content_encrypted: encoded,
        status: 'pending'
      })

    if (messageError) {
      setError(messageError.message)
      setLoading(false)
      return
    }

    setRecipientEmail('')
    setContent('')
    setLoading(false)
    onSent()
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">New Message</h2>
          <button 
            title="Close"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="text-sm font-medium text-blue-700 mb-1 block">
              Recipient Email
            </label>
            <input
              type="email"
              placeholder="friend@example.com"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-blue-700 mb-1 block">
              Your Secret Message
            </label>
            <textarea
              placeholder="Write your message here... it will vanish after being read."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              maxLength={2000}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            />
            <p className="text-xs text-slate-400 text-right mt-1">
              {content.length}/2000
            </p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <p className="text-xs text-slate-400 text-center">
            ⚠️ This message will be permanently deleted after it is read once.
          </p>

          <button
            onClick={handleSend}
            disabled={loading || !recipientEmail || !content}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Message 🔥'}
          </button>
        </div>
      </div>
    </div>
  )
}