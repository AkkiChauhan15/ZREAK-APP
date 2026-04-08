'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

// 🛠️ The Timezone Fixer: Forces YYYY-MM-DD in your Local Time
function getLocalYYYYMMDD() {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getDaysDiff(date1: string | null, date2: string) {
  if (!date1) return null
  const d1 = new Date(date1)
  d1.setHours(0, 0, 0, 0)
  const d2 = new Date(date2)
  d2.setHours(0, 0, 0, 0)
  const diff = d2.getTime() - d1.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState('Warrior')
  const [streaks, setStreaks] = useState<any[]>([])
  
  const [streakMode, setStreakMode] = useState<'manual' | 'github' | 'leetcode'>('manual')
  const [linkedAccounts, setLinkedAccounts] = useState({ github: false, leetcode: false })
  const [message, setMessage] = useState('')

  const [newStreakName, setNewStreakName] = useState('')
  const [newStreakIcon, setNewStreakIcon] = useState('🏋️')
  const [heatmap, setHeatmap] = useState<number[]>(Array(28).fill(0))

  const todayStr = getLocalYYYYMMDD() // 🔥 Uses local time now!

  useEffect(() => {
    fetchData()
  }, [])

   const fetchData = async () => {
     const { data: { user } } = await supabase.auth.getUser()
     if (!user) return
     setUser(user)

     const { data: profile } = await supabase.from('profiles').select('username, github_username, leetcode_username').eq('id', user.id).single()
     if (profile) {
       setUserName(profile.username || 'Warrior')
       setLinkedAccounts({ github: !!profile.github_username, leetcode: !!profile.leetcode_username })
     }

     // Fetch streaks from API endpoint
     const res = await fetch('/api/streaks');
     if (!res.ok) {
       console.error('Failed to fetch streaks');
       return;
     }
     
      const { streaks } = await res.json();
      if (streaks) {
        const updatedStreaks = await Promise.all(streaks.map(async (streak: any) => {
          const diffDays = getDaysDiff(streak.last_check_in, todayStr)
          if (diffDays !== null && diffDays > 1 && streak.current_count > 0 && streak.status !== 'broken') {
            await supabase.from('streaks').update({ status: 'broken' }).eq('id', streak.id)
            return { ...streak, status: 'broken' }
          }
          return streak
        }))
        setStreaks(updatedStreaks)
      }

     // Fetch check-ins for heatmap
     const { data: checkIns } = await supabase.from('check_ins').select('date_checked').eq('user_id', user.id)
     if (checkIns) {
       const mapData = Array(28).fill(0)
       const todayDate = new Date(todayStr) // Align heatmap with local time
       todayDate.setHours(0,0,0,0)
       
       checkIns.forEach(ci => {
         const ciDate = new Date(ci.date_checked)
         ciDate.setHours(0,0,0,0)
         const diffTime = todayDate.getTime() - ciDate.getTime()
         const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
         if (diffDays >= 0 && diffDays < 28) mapData[27 - diffDays] += 1
       })
       setHeatmap(mapData)
     }
   }

  const handleAddStreak = async () => {
    setMessage('')
    let finalName = newStreakName
    let finalIcon = newStreakIcon
    let autoProvider = null

    if (streakMode === 'github') {
      if (!linkedAccounts.github) return setMessage('❌ Link your GitHub in Settings first!')
      finalName = 'GitHub Commits'
      finalIcon = '🐙'
      autoProvider = 'github'
    } else if (streakMode === 'leetcode') {
      if (!linkedAccounts.leetcode) return setMessage('❌ Link your LeetCode in Settings first!')
      finalName = 'LeetCode Daily'
      finalIcon = '💻'
      autoProvider = 'leetcode'
    } else if (!newStreakName) {
      return setMessage('❌ Please enter a habit name.')
    }

    const { data, error } = await supabase.from('streaks').insert({
      user_id: user.id, streak_name: finalName, icon: finalIcon, current_count: 0, status: 'active', auto_sync_provider: autoProvider 
    }).select().single()

    if (!error && data) {
      setStreaks([...streaks, data])
      setNewStreakName('')
      setStreakMode('manual') 
    }
  }

  const handleCheckIn = async (streak: any) => {
    if (streak.auto_sync_provider) return 

    const diffDays = getDaysDiff(streak.last_check_in, todayStr)
    let newCount = streak.current_count
    
    if (diffDays === null) newCount = 1
    else if (diffDays === 0) return
    else if (diffDays === 1) newCount += 1
    else newCount = 1

    const { error: checkInError } = await supabase.from('check_ins').insert({
      streak_id: streak.id, user_id: user.id, date_checked: todayStr
    })

    // 🔥 Gracefully handle duplicate check-ins so the UI doesn't freeze
    if (checkInError && checkInError.code !== '23505') {
      alert(`Database Error: ${checkInError.message}`)
      return
    }

    await supabase.from('streaks').update({
      current_count: newCount, last_check_in: todayStr, status: 'active'
    }).eq('id', streak.id)
    fetchData() 
  }

  // 🔥 NEW: Give Up / Delete Streak
  const handleAbandon = async (streakId: string, name: string) => {
    if (!confirm(`Are you sure you want to give up on "${name}"? This will be broadcasted to your friends.`)) return;
    
    await supabase.from('streaks')
      .update({ status: 'abandoned' }) 
      .eq('id', streakId)
    
    fetchData() // Refresh UI to hide it
  }

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 font-sans text-zinc-900">
      <div className="mx-auto max-w-lg space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Stay hard, {userName}!</h1>
            <p className="font-medium text-zinc-500">Don't let your squad down.</p>
          </div>
        </div>

        {message && (
          <div className="rounded-xl bg-red-50 border-2 border-red-200 p-3 text-sm font-bold text-red-800 text-center">
            {message}
          </div>
        )}

        <section className="rounded-3xl border-2 border-zinc-200 bg-white p-2 shadow-sm border-b-[6px]">
          <div className="flex gap-2 mb-2 p-2 bg-zinc-50 rounded-2xl">
            <button onClick={() => setStreakMode('manual')} className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${streakMode === 'manual' ? 'bg-white shadow-sm border-2 border-zinc-200' : 'text-zinc-500 hover:bg-zinc-100'}`}>✍️ Manual</button>
            <button onClick={() => setStreakMode('github')} className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${streakMode === 'github' ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100'}`}>🐙 GitHub</button>
            <button onClick={() => setStreakMode('leetcode')} className={`flex-1 rounded-xl py-2 text-sm font-bold transition-all ${streakMode === 'leetcode' ? 'bg-yellow-500 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-100'}`}>💻 LeetCode</button>
          </div>

          <div className="flex gap-2">
            {streakMode === 'manual' ? (
              <>
                <select value={newStreakIcon} onChange={(e) => setNewStreakIcon(e.target.value)} className="rounded-xl bg-zinc-100 px-3 text-xl focus:outline-none cursor-pointer">
                  <option value="🏋️">🏋️</option>
                  <option value="📚">📚</option>
                  <option value="💧">💧</option>
                  <option value="🏃">🏃</option>
                  <option value="🧘">🧘</option>
                </select>
                <input type="text" placeholder="e.g. Gym Session" value={newStreakName} onChange={(e) => setNewStreakName(e.target.value)} className="flex-1 rounded-xl bg-transparent px-2 font-bold focus:outline-none" />
              </>
            ) : (
              <div className="flex-1 flex items-center px-4 rounded-xl bg-zinc-100 text-zinc-500 font-bold text-sm">
                {streakMode === 'github' ? 'Automated GitHub Commits sync' : 'Automated LeetCode sync'}
              </div>
            )}
            <button onClick={handleAddStreak} className="rounded-xl bg-orange-500 border-b-4 border-orange-600 active:border-b-0 active:translate-y-[4px] px-6 py-3 font-bold text-white transition-all">Add</button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold">Today's Missions</h2>
          
          {streaks.length === 0 && (
             <p className="text-zinc-500 font-medium text-center py-4">No active streaks. Add one above!</p>
          )}

          {streaks.map((streak) => {
            const isDoneToday = streak.last_check_in === todayStr
            const isBroken = streak.status === 'broken'
            const isBrandNew = !streak.last_check_in || (streak.current_count === 0 && !isBroken)
            const isAuto = !!streak.auto_sync_provider

            return (
              <div key={streak.id} className={`group flex items-center justify-between rounded-3xl border-2 p-5 border-b-[6px] transition-all ${isDoneToday ? 'border-green-200 bg-green-50' : isBroken ? 'border-red-200 bg-red-50' : 'border-zinc-200 bg-white'}`}>
                <div className="flex items-center gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl shadow-inner ${isDoneToday ? 'bg-green-500 text-white' : isBroken ? 'bg-red-200' : isAuto ? 'bg-blue-100' : 'bg-zinc-100'}`}>
                    {streak.icon}
                  </div>
                  <div>
                    <h3 className={`font-bold ${isDoneToday ? 'text-green-900' : isBroken ? 'text-red-900' : 'text-zinc-900'}`}>
                      {streak.streak_name} {isAuto && <span className="text-xs ml-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-full">Auto</span>}
                    </h3>
                    <p className={`text-sm font-bold ${isBrandNew ? 'text-zinc-500' : isDoneToday ? 'text-green-700' : isBroken ? 'text-red-600' : 'text-orange-500'}`}>
                      {isBrandNew ? '🏁 Start your streak' : isBroken ? '⚠️ Streak Reset' : `🔥 ${streak.current_count} Day Streak`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* 🔥 The Delete/Give Up Button */}
                  <button 
                    onClick={() => handleAbandon(streak.id, streak.streak_name)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 hover:bg-red-100 hover:text-red-600 transition-colors"
                    title="Give up and remove streak"
                  >
                    🗑️
                  </button>

                  {isAuto ? (
                     <div className="rounded-xl bg-blue-50 border-2 border-blue-200 px-4 py-2 font-bold text-blue-700 text-sm">
                       {isDoneToday ? 'Synced ✅' : 'Syncing at midnight ⏳'}
                     </div>
                  ) : isDoneToday ? (
                    <button disabled className="rounded-xl bg-green-200 px-4 py-2 font-bold text-green-700 opacity-50">Done</button>
                  ) : (
                    <button onClick={() => handleCheckIn(streak)} className="rounded-xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-4 py-2 font-bold text-white transition-all hover:bg-orange-400">
                      Check In
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </section>

        <section className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Total Intensity</h2>
            <span className="text-sm font-bold text-zinc-400">Last 28 Days</span>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {heatmap.map((intensity, index) => {
              let bgColor = "bg-zinc-100"
              if (intensity === 1) bgColor = "bg-orange-200"
              if (intensity >= 2) bgColor = "bg-orange-500 shadow-sm shadow-orange-500/50"
              return <div key={index} className={`aspect-square w-full rounded-xl ${bgColor} transition-transform hover:scale-110`} title={`${intensity} activities completed`} />
            })}
          </div>
        </section>

      </div>
    </div>
  )
}