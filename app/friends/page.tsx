'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function FriendsPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  
  const [friendUsername, setFriendUsername] = useState('')
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [activeFriends, setActiveFriends] = useState<any[]>([])
  const [feed, setFeed] = useState<any[]>([]) 
  const [message, setMessage] = useState('')

  const fetchFriendsData = useCallback(async (userId: string, myUsername: string) => {
    // 1. Fetch Pending Requests
    const { data: pending } = await supabase
      .from('friendships')
      .select('id, profiles!friendships_user_id_fkey(username)')
      .eq('friend_id', userId)
      .eq('status', 'pending')
    if (pending) setPendingRequests(pending)

    // 2. Fetch Accepted Friends
    const { data: sentReqs } = await supabase.from('friendships').select('profiles!friendships_friend_id_fkey(id, username)').eq('user_id', userId).eq('status', 'accepted')
    const { data: receivedReqs } = await supabase.from('friendships').select('profiles!friendships_user_id_fkey(id, username)').eq('friend_id', userId).eq('status', 'accepted')
    
    const combinedFriends = [
      ...(sentReqs?.map(r => r.profiles) || []),
      ...(receivedReqs?.map(r => r.profiles) || [])
    ]
    setActiveFriends(combinedFriends)

    // 3. THE LIVE FEED ENGINE
    const squadIds = [userId, ...combinedFriends.map(f => f.id)]

    // Pull recent wins
    const { data: recentCheckIns } = await supabase
      .from('check_ins')
      .select('id, created_at, profiles(username), streaks(streak_name, icon, current_count)')
      .in('user_id', squadIds)
      .order('created_at', { ascending: false })
      .limit(10)

    // 🔥 UPDATED: Pull BOTH broken and abandoned streaks
    const { data: negativeStreaks } = await supabase
      .from('streaks')
      .select('id, streak_name, icon, status, profiles(username)')
      .in('user_id', squadIds)
      .in('status', ['broken', 'abandoned']) 
      .limit(10)

    const formattedFeed: any[] = []
    
    recentCheckIns?.forEach(ci => {
      formattedFeed.push({
        id: `ci-${ci.id}`,
        type: 'success',
        username: ci.profiles.username,
        isMe: ci.profiles.username === myUsername,
        icon: ci.streaks.icon,
        streakName: ci.streaks.streak_name,
        count: ci.streaks.current_count,
        timestamp: new Date(ci.created_at).getTime()
      })
    })

    // 🔥 Map the negative streaks dynamically based on their actual status
    negativeStreaks?.forEach(bs => {
      formattedFeed.push({
        id: `bs-${bs.id}`,
        type: bs.status, // Will be either 'broken' or 'abandoned'
        username: bs.profiles.username,
        isMe: bs.profiles.username === myUsername,
        icon: bs.icon,
        streakName: bs.streak_name,
        timestamp: Date.now() - Math.random() * 1000 
      })
    })

    formattedFeed.sort((a, b) => b.timestamp - a.timestamp)
    setFeed(formattedFeed)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', user.id).single()
        setCurrentProfile(profile)
        fetchFriendsData(user.id, profile?.username)
      }
    }
    loadData()
  }, [fetchFriendsData])

  const handleViewProfile = () => {
    if (!friendUsername) return setMessage('❌ Enter a username to search.')
    router.push(`/user/${friendUsername}`)
  }

  const handleAddFriend = async () => {
    if (!currentUser) return setMessage('❌ Please log in first.')
    if (friendUsername === currentProfile?.username) return setMessage("❌ You can't add yourself.")
    
    const { data: friendProfile, error: searchError } = await supabase.from('profiles').select('id').eq('username', friendUsername).single()
    if (searchError || !friendProfile) return setMessage('❌ Warrior not found.')

    const { error: insertError } = await supabase.from('friendships').insert({ user_id: currentUser.id, friend_id: friendProfile.id })
    if (insertError) setMessage('❌ Request already sent.')
    else {
      setMessage(`✅ Challenge sent to @${friendUsername}!`)
      setFriendUsername('') 
    }
  }

  const handleAccept = async (requestId: string) => {
    const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId)
    if (!error) {
      setMessage('✅ Rival added to your squad!')
      setPendingRequests((prev) => prev.filter(req => req.id !== requestId))
      fetchFriendsData(currentUser.id, currentProfile?.username) 
    }
  }

  return (
    <div className="min-h-screen pb-20 pt-8 px-4 font-sans text-zinc-900">
      <div className="mx-auto max-w-lg space-y-10">
        
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Your Squad</h1>
          <p className="font-medium text-zinc-500">Hold them accountable. Or shame them.</p>
        </div>

        {message && (
          <div className="rounded-xl bg-zinc-800 p-3 text-sm font-bold text-zinc-50 text-center">
            {message}
          </div>
        )}

        <section className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px]">
          <h2 className="mb-4 text-lg font-bold">Find a Warrior</h2>
          <div className="flex gap-2 mb-4">
            <span className="flex items-center justify-center rounded-xl bg-zinc-100 px-4 font-bold text-zinc-500">@</span>
            <input 
              type="text" 
              placeholder="username" 
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 font-medium focus:border-orange-500 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={handleViewProfile} className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-100 border-b-4 active:border-b-2 active:translate-y-[2px] px-4 py-3 font-bold text-zinc-700 transition-all hover:bg-zinc-200">
              Inspect
            </button>
            <button onClick={handleAddFriend} className="flex-1 rounded-xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-4 py-3 font-bold text-white transition-all hover:bg-orange-400">
              Challenge
            </button>
          </div>
        </section>

        {pendingRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider text-sm">Pending Requests</h2>
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-xl">👤</div>
                  <Link href={`/user/${req.profiles?.username}`} className="font-bold truncate max-w-[150px] hover:text-orange-500 hover:underline">
                    @{req.profiles?.username}
                  </Link>
                </div>
                <button onClick={() => handleAccept(req.id)} className="rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-200 transition-colors">
                  Accept
                </button>
              </div>
            ))}
          </section>
        )}

        <section className="space-y-4 pt-4 border-t-2 border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider text-sm">Live Battlefield Feed</h2>
          
          {feed.length === 0 ? (
            <p className="text-zinc-500 font-medium py-4 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
              It's quiet. Add friends or complete a mission to wake up the feed.
            </p>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex flex-col gap-2 rounded-3xl border-2 p-5 border-b-[6px] transition-all ${
                    item.type === 'success' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-zinc-200 bg-zinc-100 grayscale-[50%] opacity-80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                      {item.icon}
                    </div>
                    <p className={`font-bold text-lg ${item.type === 'success' ? 'text-green-900' : 'text-zinc-700'}`}>
                      <Link href={`/user/${item.username}`} className="font-extrabold hover:underline">
                        {item.isMe ? 'You' : `@${item.username}`}
                      </Link> 
                      {/* 🔥 Dynamic Message mapping 3 states */}
                      {item.type === 'success' ? ` crushed their goal!` : 
                       item.type === 'abandoned' ? ` surrendered and deleted their streak.` : 
                       ` lost their streak.`}
                    </p>
                  </div>
                  
                  <div className="pl-12 flex items-center justify-between">
                    <p className={`text-sm font-medium ${item.type === 'success' ? 'text-green-700' : 'text-zinc-500'}`}>
                      {/* 🔥 Dynamic Subtitle mapping 3 states */}
                      {item.type === 'success' ? `🔥 ${item.count} Day Streak: ${item.streakName}` : 
                       item.type === 'abandoned' ? `🏳️ Given Up: ${item.streakName}` :
                       `💀 Mission Failed: ${item.streakName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3 pt-4 border-t-2 border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider text-sm">Active Squad</h2>
          {activeFriends.length === 0 ? (
            <p className="text-zinc-500 font-medium py-4 text-center border-2 border-dashed border-zinc-200 rounded-2xl">
              You have no active rivals yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {activeFriends.map((friend, index) => (
                <Link key={index} href={`/user/${friend?.username}`} className="group flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-zinc-200 bg-white p-4 transition-all hover:border-orange-500 hover:shadow-sm">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 text-2xl group-hover:bg-orange-100 transition-colors">👤</div>
                  <span className="font-bold truncate w-full text-center">@{friend?.username}</span>
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}