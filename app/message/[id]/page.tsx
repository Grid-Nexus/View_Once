'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

type PageState = 'loading' | 'ready' | 'reading' | 'destroyed' | 'error'

export default function MessagePage() {
  const params = useParams()
  const router = useRouter()
  const [state, setState] = useState<PageState>('loading')
  const [message, setMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    async function loadMessage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('messages')
        .select('id, content_encrypted, status, receiver_id')
        .eq('id', params.id)
        .single()

      if (error || !data) {
        setError('Message not found or already destroyed.')
        setState('error')
        return
      }

      if (data.receiver_id !== user.id) {
        setError('You are not the recipient of this message.')
        setState('error')
        return
      }

      if (data.status === 'deleted') {
        setError('This message has already been destroyed.')
        setState('error')
        return
      }

      // Decode the base64 encoded message
      try {
        const decoded = decodeURIComponent(escape(atob(data.content_encrypted)))
        setMessage(decoded)
      } catch {
        setMessage(data.content_encrypted)
      }

      setState('ready')
    }

    loadMessage()
  }, [params.id])

  async function handleReveal() {
    setState('reading')

    // Start countdown
    let count = 5
    const timer = setInterval(() => {
      count -= 1
      setCountdown(count)
      if (count === 0) clearInterval(timer)
    }, 1000)

    // After 5 seconds delete and redirect
    setTimeout(async () => {
      await supabase
        .from('messages')
        .update({ 
          status: 'deleted',
          deleted_at: new Date().toISOString(),
          read_at: new Date().toISOString()
        })
        .eq('id', params.id)

      setState('destroyed')

      // After 2 seconds redirect with hard reload
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 2000)

    }, 5000)
  }

  return (
    <main className="min-h-screen bg-[#dce8f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md flex flex-col items-center gap-6 text-center">

        {/* Logo */}
        <div className="bg-blue-600 rounded-full p-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>

        {/* LOADING */}
        {state === 'loading' && (
          <div>
            <h2 className="text-xl font-bold text-slate-700">Loading message...</h2>
          </div>
        )}

        {/* READY — before revealing */}
        {state === 'ready' && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold text-blue-700">You have a secret message</h2>
            <p className="text-slate-400 text-sm">
              ⚠️ Once you read it, it will be <strong>permanently destroyed</strong> in 5 seconds.
            </p>
            <button
              onClick={handleReveal}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition"
            >
              👁 Reveal Message
            </button>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              ← Back to inbox
            </button>
          </div>
        )}

        {/* READING — message visible, countdown running */}
        {state === 'reading' && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-xl font-bold text-red-500">
              🔥 Destroying in {countdown} seconds...
            </h2>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-left">
              <p className="text-slate-800 text-base leading-relaxed">{message}</p>
            </div>
            <p className="text-xs text-slate-400">This message is being permanently deleted.</p>
          </div>
        )}

        {/* DESTROYED */}
        {state === 'destroyed' && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold text-slate-700">💨 Message Destroyed</h2>
            <p className="text-slate-400 text-sm">
              This message has been permanently deleted and cannot be recovered.
            </p>
            <p className="text-xs text-slate-400">Redirecting you back...</p>
          </div>
        )}

        {/* ERROR */}
        {state === 'error' && (
          <div className="flex flex-col gap-4 w-full">
            <h2 className="text-2xl font-bold text-slate-700">💨 Message Gone</h2>
            <p className="text-slate-400 text-sm">{error}</p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition"
            >
              Back to inbox
            </button>
          </div>
        )}

        <p className="text-slate-400 text-xs">• Private. Secure. Ephemeral.</p>
      </div>
    </main>
  )
}