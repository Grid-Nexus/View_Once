'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
  setLoading(true)
  setError('')
  const { error } = await supabase.auth.signInWithOtp({ 
    email,
    options: { 
      shouldCreateUser: true,
      emailRedirectTo: undefined,
      data: {}
    }
  })
  if (error) setError(error.message)
  else setStep('otp')
  setLoading(false)
}

  async function handleVerifyOtp() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })
    if (error) setError(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-[#dce8f5] flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-md p-10 w-full max-w-md flex flex-col items-center gap-6">

        {/* Icon */}
        <div className="bg-blue-600 rounded-full p-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-700">View Once</h1>
          <p className="text-slate-400 text-sm mt-1">Read it. Gone.</p>
        </div>

        {/* Email step */}
        {step === 'email' && (
          <div className="w-full flex flex-col gap-4">
            <label className="text-sm font-medium text-blue-700">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleSendCode}
              disabled={loading || !email}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Code'}
            </button>
            <p className="text-center text-slate-400 text-xs">
              We'll send a one-time verification code to your email
            </p>
          </div>
        )}

        {/* OTP step */}
        {step === 'otp' && (
          <div className="w-full flex flex-col gap-4">
            <label className="text-sm font-medium text-blue-700">
              Enter the 6-digit code sent to {email}
            </label>
            <input
              type="text"
              placeholder="123456"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length < 6}
              className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
            <button
              onClick={() => setStep('email')}
              className="text-sm text-slate-400 hover:text-slate-600 text-center"
            >
              ← Back to email
            </button>
          </div>
        )}

        <p className="text-slate-400 text-xs">• Private. Secure. Ephemeral.</p>
      </div>
    </main>
  )
}