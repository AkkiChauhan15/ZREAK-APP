'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  
  // Input states
  const [githubUsername, setGithubUsername] = useState('')
  const [leetcodeUsername, setLeetcodeUsername] = useState('')
  
  // UI states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Load existing profile data when the page opens
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        const { data, error } = await supabase
          .from('profiles')
          .select('github_username, leetcode_username')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          if (data.github_username) setGithubUsername(data.github_username)
          if (data.leetcode_username) setLeetcodeUsername(data.leetcode_username)
        }
      }
      setLoading(false)
    }
    loadProfile()
  }, [])

  // Save changes to the database
  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('profiles')
      .update({
        github_username: githubUsername || null, // Convert empty strings to null
        leetcode_username: leetcodeUsername || null
      })
      .eq('id', user.id)

    if (error) {
      setMessage(`❌ Failed to save: ${error.message}`)
    } else {
      setMessage('✅ Integrations saved successfully!')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-center mt-20 font-bold animate-pulse">Loading arsenal...</div>

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 font-sans text-zinc-900">
      <div className="mx-auto max-w-lg space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
            <p className="font-medium text-zinc-500">Link accounts for auto-sync.</p>
          </div>
          <Link href="/dashboard" className="rounded-xl bg-zinc-200 px-4 py-2 font-bold text-zinc-700 hover:bg-zinc-300 transition-colors">
            Back
          </Link>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`rounded-xl p-3 text-sm font-bold text-center border-2 border-b-4 ${message.includes('✅') ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        {/* Integrations Form */}
        <section className="space-y-6 rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px]">
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white text-xl">🐙</div>
              <div>
                <h2 className="font-bold">GitHub Integration</h2>
                <p className="text-xs font-medium text-zinc-500">Tracks daily code commits.</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-bold text-zinc-400">github.com/</span>
              <input 
                type="text" 
                placeholder="your_username" 
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 font-medium focus:border-orange-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <hr className="border-2 border-zinc-100 rounded-full" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500 text-white text-xl">💻</div>
              <div>
                <h2 className="font-bold">LeetCode Integration</h2>
                <p className="text-xs font-medium text-zinc-500">Tracks daily problem solving.</p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <span className="font-bold text-zinc-400">leetcode.com/u/</span>
              <input 
                type="text" 
                placeholder="your_username" 
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 font-medium focus:border-orange-500 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-4 rounded-xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-6 py-4 font-bold text-white transition-all hover:bg-orange-400 disabled:opacity-50 disabled:translate-y-0 disabled:border-b-4"
          >
            {saving ? 'Syncing...' : 'Save Integrations'}
          </button>
        </section>

      </div>
    </div>
  )
}