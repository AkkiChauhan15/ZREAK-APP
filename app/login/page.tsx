'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isSignUp, setIsSignUp] = useState(false)
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAuth = async () => {
    setLoading(true)
    setMessage('')

    if (isSignUp) {
      if (!username) {
        setMessage('❌ Please enter a username.')
        setLoading(false)
        return
      }
      // Pass the username into Supabase Auth metadata
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { username } }
      })
      if (error) setMessage(`❌ ${error.message}`)
      else setMessage('✅ Account created! You can now log in.')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage(`❌ ${error.message}`)
      else {
        setMessage('🔥 Logged in! Redirecting...')
        router.push('/dashboard') // Auto-redirect to dashboard!
      }
    }
    setLoading(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-3xl border-2 border-zinc-200 bg-white p-8 shadow-sm border-b-[6px] dark:border-zinc-800 dark:bg-zinc-900">
        
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Zreak.
          </h1>
          <p className="text-sm font-medium text-zinc-500">
            {isSignUp ? "Create your warrior profile." : "Welcome back to the battlefield."}
          </p>
        </div>

        {message && (
          <div className="rounded-xl bg-zinc-800 p-3 text-sm font-bold text-zinc-50 text-center">
            {message}
          </div>
        )}

        <div className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Username</label>
              <input 
                type="text" 
                placeholder="akki_123" 
                // 🔥 Added text-zinc-900 here
                className="flex w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-3 font-medium text-zinc-900 focus:border-orange-500 focus:outline-none"
                onChange={(e) => setUsername(e.target.value)} 
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Email</label>
            <input 
              type="email" 
              placeholder="warrior@email.com" 
              // 🔥 Added text-zinc-900 here
              className="flex w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-3 font-medium text-zinc-900 focus:border-orange-500 focus:outline-none"
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              // 🔥 Added text-zinc-900 here
              className="flex w-full rounded-xl border-2 border-zinc-200 bg-zinc-50 px-3 py-3 font-medium text-zinc-900 focus:border-orange-500 focus:outline-none"
              onChange={(e) => setPassword(e.target.value)} 
            />
          </div>

          <div className="pt-2">
            <button 
              onClick={handleAuth} 
              disabled={loading}