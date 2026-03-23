'use client'
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if the user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('username').eq('id', user.id).single();
        if (data?.username) setUsername(data.username);
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // 🟢 The Logout Function
  const handleLogout = async () => {
    setLoading(true); // Show skeleton while processing
    await supabase.auth.signOut();
    setUsername(null); // Clear the state
    setLoading(false);
    router.refresh(); // Tell Next.js to refresh the route data
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 text-center dark:bg-zinc-950">
      
      {/* Hero Section */}
      <div className="max-w-3xl space-y-6">
        <h1 className="text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-7xl dark:text-zinc-50">
          Build Habits. <br className="hidden sm:block" />
          <span className="text-orange-500">Wreck Your Friends.</span>
        </h1>
        
        <p className="mx-auto max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
          Zreak isn't just a habit tracker. It's a social battlefield. Track your daily commits, Gym sessions, or custom streaks. Prove you did it, or lose your streak publicly.
        </p>

        {/* Dynamic Call to Action Buttons */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4 min-h-[5rem]">
          
          {loading ? (
            // Loading State (Pulsing skeleton)
            <div className="h-14 w-64 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800"></div>
          ) : username ? (
            // LOGGED IN: Show personalized continue button AND Logout
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <Link 
                  href="/dashboard" 
                  className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-8 font-bold text-white transition-all hover:bg-orange-400"
                >
                  Continue as @{username} ⚡️
                </Link>
                <Link 
                  href="/friends" 
                  className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-8 font-bold text-zinc-900 transition-all hover:bg-zinc-50 hover:shadow-sm active:translate-y-[2px] active:border-b-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
                >
                  View Squad
                </Link>
              </div>
              
              {/* 🟢 The New Logout Button */}
              <button 
                onClick={handleLogout}
                className="text-sm font-bold text-zinc-500 hover:text-red-500 transition-colors"
              >
                Not @{username}? Log out
              </button>
            </div>
          ) : (
            // LOGGED OUT: Show original signup buttons
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/login" 
                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-2xl border-2 border-orange-500 bg-orange-500 border-b-4 active:border-b-2 active:translate-y-[2px] px-8 font-bold text-white transition-all hover:bg-orange-400"
              >
                Start Tracking Free
              </Link>
              <Link 
                href="/login" 
                className="inline-flex h-14 items-center justify-center rounded-2xl border-2 border-zinc-200 bg-white px-8 font-bold text-zinc-900 transition-all hover:bg-zinc-50 hover:shadow-sm active:translate-y-[2px] active:border-b-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-zinc-800"
              >
                Login
              </Link>
            </div>
          )}

        </div>
      </div>

      {/* Feature Teaser */}
      <div className="mt-20 grid max-w-4xl grid-cols-1 gap-8 text-left sm:grid-cols-3">
        <div className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 text-3xl">🔥</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Multi-Streak System</h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">Track coding, fitness, and lifestyle all in one place.</p>
        </div>
        <div className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 text-3xl">📸</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Proof System</h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">Upload proof. Prevent fake streaks. Build real trust.</p>
        </div>
        <div className="rounded-3xl border-2 border-zinc-200 bg-white p-6 shadow-sm border-b-[6px] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 text-3xl">⚔️</div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-50">Streak Battles</h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">Challenge friends 1v1. First to break the streak loses.</p>
        </div>
      </div>

    </div>
  );
}