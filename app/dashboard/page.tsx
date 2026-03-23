'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const [userName, setUserName] = useState('Warrior')
  const heatmapData = Array.from({ length: 28 }, () => Math.floor(Math.random() * 4))

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch the username from the profiles table
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        if (data?.username) setUserName(data.username)
      }
    }
    fetchProfile()
  }, [])

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 font-sans text-zinc-900">
      <div className="mx-auto max-w-lg space-y-8">
        
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Stay hard, {userName}!</h1>
            <p className="font-medium text-zinc-500">Let's crush today's goals.</p>
          </div>
          <div className="flex items-center gap-1 rounded-2xl border-2 border-orange-200 bg-orange-100 px-4 py-2 text-orange-600 font-bold">
            <span className="text-xl">🔥</span>
            <span>1,204</span>
          </div>
        </div>

        {/* --- Keep the rest of your Dashboard UI identical below this line --- */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold">Today's Missions</h2>
          <div className="group flex items-center justify-between rounded-3xl border-2 border-zinc-200 bg-white p-5 border-b-[6px] active:border-b-2 active:translate-y-1 transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-2xl shadow-inner group-hover:bg-orange-100 transition-colors">🏋️</div>
              <div>
                <h3 className="font-bold">Gym Session</h3>
                <p className="text-sm font-medium text-zinc-500">0 / 1 Completed</p>
              </div>
            </div>
            <button className="rounded-xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-4 py-2 font-bold text-white transition-all hover:bg-orange-400">
              Check In
            </button>
          </div>
        </section>

      </div>
    </div>
  )
}