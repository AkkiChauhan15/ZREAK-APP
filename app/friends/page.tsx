'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [currentProfile, setCurrentProfile] = useState<any>(null)
  const [friendUsername, setFriendUsername] = useState('')
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUser(user)
        const { data: profile } = await supabase.from('profiles').select('username').eq('id', user.id).single()
        setCurrentProfile(profile)
        fetchPendingRequests(user.id)
      }
    }
    loadData()
  }, [])

  const fetchPendingRequests = async (userId: string) => {
    const { data, error } = await supabase
      .from('friendships')
      .select('id, user_id, profiles!friendships_user_id_fkey(username)')
      .eq('friend_id', userId)
      .eq('status', 'pending')

    if (!error && data) setPendingRequests(data)
  }

  const handleAddFriend = async () => {
    if (!currentUser) return setMessage('❌ Please log in first.')
    if (friendUsername === currentProfile?.username) return setMessage("❌ You can't add yourself.")
    
    // Search by username instead of email
    const { data: friendProfile, error: searchError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', friendUsername)
      .single()

    if (searchError || !friendProfile) return setMessage('❌ Warrior not found.')

    const { error: insertError } = await supabase
      .from('friendships')
      .insert({ user_id: currentUser.id, friend_id: friendProfile.id })

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

        {/* Add Friend Section */}
        <section className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px]">
          <h2 className="mb-4 text-lg font-bold">Add a Rival</h2>
          <div className="flex gap-2">
            <span className="flex items-center justify-center rounded-xl bg-zinc-100 px-4 font-bold text-zinc-500">@</span>
            <input 
              type="text" 
              placeholder="akki_123" 
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              className="flex-1 rounded-xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3 font-medium focus:border-orange-500 focus:outline-none focus:ring-0"
            />
            <button 
              onClick={handleAddFriend}
              className="rounded-xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-6 font-bold text-white transition-all hover:bg-orange-400"
            >
              Add
            </button>
          </div>
        </section>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-zinc-400 uppercase tracking-wider text-sm">Pending Requests</h2>
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between rounded-2xl border-2 border-zinc-200 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl">👤</div>
                  {/* Display their Username! */}
                  <span className="font-bold truncate max-w-[150px]">@{req.profiles?.username}</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAccept(req.id)}
                    className="rounded-lg bg-green-100 px-3 py-2 text-sm font-bold text-green-700 hover:bg-green-200 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  )
}