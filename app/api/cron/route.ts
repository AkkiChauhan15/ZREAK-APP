import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ CRITICAL: You must use the SERVICE ROLE KEY here, not the ANON KEY.
// Cron jobs aren't logged in, so they need admin privileges to update the database.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Get this from Supabase -> Project Settings -> API
);

export async function GET(request: Request) {
  // Security: Prevent random people from running this script
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split('T')[0];

  try {
    // 1. Find all users who have an active GitHub streak setup
    const { data: streaks } = await supabaseAdmin
      .from('streaks')
      .select('id, current_count, last_check_in, user_id, profiles!inner(github_username)')
      .eq('auto_sync_provider', 'github');

    if (!streaks) return NextResponse.json({ message: 'No GitHub streaks to sync.' });

    for (const streak of streaks) {
      const githubUser = streak.profiles.github_username;
      if (!githubUser) continue;

      // 2. Fetch their recent activity from GitHub's Public API
      const res = await fetch(`https://api.github.com/users/${githubUser}/events/public`);
      const events = await res.json();

      // 3. Check if they made a "PushEvent" (a code commit) TODAY
      const pushedToday = events.some((event: any) => {
        return event.type === 'PushEvent' && event.created_at.startsWith(todayStr);
      });

      if (pushedToday && streak.last_check_in !== todayStr) {
        // SUCCESS: They coded today! Log the check-in.
        await supabaseAdmin.from('check_ins').insert({
          streak_id: streak.id,
          user_id: streak.user_id,
          date_checked: todayStr
        });

        await supabaseAdmin.from('streaks').update({
          current_count: streak.current_count + 1,
          last_check_in: todayStr,
          status: 'active'
        }).eq('id', streak.id);
      }
      // Note: If they didn't push today, we do nothing. The existing Dashboard logic 
      // will automatically mark it as "Broken" tomorrow if they miss the whole day!
    }

    return NextResponse.json({ success: true, message: 'GitHub streaks synced successfully.' });

  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}