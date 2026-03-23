'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export default function UserProfile() {
  const params = useParams()
  const targetUsername = params.username as string
  
  const [profile, setProfile] = useState<any>(null)
  const [streaks, setStreaks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndStreaks = async () => {
      // 1. Find the user ID based on the username in the URL
      const { data: targetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', targetUsername)
        .single()

      if (profileError || !targetProfile) {
        setLoading(false)
        return
      }
      setProfile(targetProfile)

      // 2. Fetch their streaks
      const { data: theirStreaks } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', targetProfile.id)
        .order('created_at', { ascending: true })

      if (theirStreaks) setStreaks(theirStreaks)
      setLoading(false)
    }

    fetchUserAndStreaks()
  }, [targetUsername])

  if (loading) return <div className="text-center mt-20 font-bold animate-pulse">Scanning battlefield...</div>
  
  if (!profile) return (
    <div className="text-center mt-20 space-y-4">
      <h1 className="text-2xl font-bold">❌ Warrior not found.</h1>
      <Link href="/friends" className="text-orange-500 hover:underline font-bold">Go back to Squad</Link>
    </div>
  )

  const todayStr = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 font-sans text-zinc-900">
      <div className="mx-auto max-w-lg space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-orange-500">@{profile.username}</h1>
            <p className="font-medium text-zinc-500">Public Battlefield</p>
          </div>
          <Link href="/friends" className="rounded-xl bg-zinc-200 px-4 py-2 font-bold text-zinc-700 hover:bg-zinc-300 transition-colors">
            Back
          </Link>
        </div>

        {/* Their Active Streaks List (Read-Only) */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Current Missions</h2>
          
          {streaks.length === 0 && (
             <p className="text-zinc-500 font-medium text-center py-4">This warrior hasn't set any goals yet.</p>
          )}

          {streaks.map((streak) => {
            const isDoneToday = streak.last_check_in === todayStr
            const isBroken = streak.status === 'broken'
            const isBrandNew = !streak.last_check_in || (streak.current_count === 0 && !isBroken)

            return (
              <div key={streak.id} className={`flex items-center justify-between rounded-3xl border-2 p-5 border-b-[6px] transition-all ${isDoneToday ? 'border-green-200 bg-green-50' : isBroken ? 'border-red-200 bg-red-50 grayscale' : 'border-zinc-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner ${isDoneToday ? 'bg-green-500 text-white' : isBroken ? 'bg-red-200' : 'bg-zinc-100'}`}>
                    {streak.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDoneToday ? 'text-green-900' : isBroken ? 'text-red-900' : 'text-zinc-900'}`}>
                      {streak.streak_name}
                    </h3>
                    <p className={`text-sm font-bold ${isBrandNew ? 'text-zinc-500' : isDoneToday ? 'text-green-700' : isBroken ? 'text-red-600' : 'text-orange-500'}`}>
                      {isBrandNew ? '🏁 Not started yet' : isBroken ? '⚠️ Streak Reset' : `🔥 ${streak.current_count} Day Streak`}
                    </p>
                  </div>
                </div>
                
                {/* Status Badge instead of a button */}
                <div className={`rounded-xl px-4 py-2 font-bold text-sm ${isDoneToday ? 'bg-green-200 text-green-800' : isBroken ? 'bg-red-200 text-red-800' : 'bg-zinc-100 text-zinc-500'}`}>
                  {isDoneToday ? 'Completed Today' : isBroken ? 'Failed' : 'Pending...'}
                </div>
              </div>
            )
          })}
        </section>

      </div>
    </div>
  )
}