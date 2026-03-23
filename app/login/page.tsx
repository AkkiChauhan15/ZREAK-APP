'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSignUp = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setMessage(`❌ ${error.message}`)
    else setMessage('✅ Account created! You can now log in.')
    setLoading(false)
  }

  const handleLogin = async () => {
    setLoading(true)
    setMessage('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(`❌ ${error.message}`)
    else {
      setMessage('🔥 Successfully logged in! Redirecting...')
      // Next step: redirect to the dashboard!
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        
        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Zreak.
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enter your email below to log in or create an account to start tracking.
          </p>
        </div>

        {/* Status Message */}
        {message && (
          <div className="rounded-md bg-zinc-100 p-3 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50 text-center">
            {message}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Email
            </label>
            <input 
              type="email" 
              placeholder="akki@example.com" 
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-300"
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none text-zinc-900 dark:text-zinc-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Password
            </label>
            <input 
              type="password" 
              placeholder="••••••••" 
              className="flex h-10 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 dark:border-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-300"
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="flex flex-col space-y-2 pt-2">
            <button 
              onClick={handleLogin} 
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-900/90 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90"
            >
              {loading ? 'Processing...' : 'Login'}
            </button>
            
            <button 
              onClick={handleSignUp} 
              disabled={loading}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 bg-transparent px-4 py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800"
            >
              Sign Up
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}