import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ CRITICAL: Must use the SERVICE ROLE KEY, not the ANON KEY!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(request: Request) {
  // 1. Security Check: Only Vercel can run this file
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized intruder detected.' }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split('T')[0]; // Gets today in YYYY-MM-DD format (UTC)
  let syncResults = { github: 0, leetcode: 0, errors: 0 };

  try {
    // 2. Fetch all streaks that have auto-sync turned on
    const { data: streaks } = await supabaseAdmin
      .from('streaks')
      .select('id, current_count, last_check_in, user_id, auto_sync_provider, profiles!inner(github_username, leetcode_username)')
      .not('auto_sync_provider', 'is', null);

    if (!streaks || streaks.length === 0) {
      return NextResponse.json({ message: 'No automated streaks to process today.' });
    }

    // 3. Loop through every streak and interrogate the external APIs
    for (const streak of streaks) {
      try {
        let successToday = false;

        // ==========================================
        // 🐙 GITHUB FETCH LOGIC
        // ==========================================
        if (streak.auto_sync_provider === 'github' && streak.profiles.github_username) {
          const githubUser = streak.profiles.github_username;
          
          // Next.js caches fetches by default. We add 'no-store' to ensure fresh data.
          const res = await fetch(`https://api.github.com/users/${githubUser}/events/public`, { cache: 'no-store' });
          if (!res.ok) throw new Error(`GitHub API error for ${githubUser}`);
          
          const events = await res.json();
          
          // Check if they made a "PushEvent" (committed code) today
          successToday = events.some((event: any) => {
            return event.type === 'PushEvent' && event.created_at.startsWith(todayStr);
          });
        }

        // ==========================================
        // 💻 LEETCODE FETCH LOGIC (GraphQL)
        // ==========================================
        if (streak.auto_sync_provider === 'leetcode' && streak.profiles.leetcode_username) {
          const lcUser = streak.profiles.leetcode_username;
          
          // LeetCode's secret GraphQL query for accepted submissions
          const query = `
            query recentAcSubmissions($username: String!, $limit: Int!) {
              recentAcSubmissionList(username: $username, limit: $limit) {
                timestamp
              }
            }
          `;

          const res = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { username: lcUser, limit: 5 } }),
            cache: 'no-store'
          });

          if (!res.ok) throw new Error(`LeetCode API error for ${lcUser}`);
          
          const data = await res.json();
          const submissions = data.data?.recentAcSubmissionList || [];

          // LeetCode timestamps are in Unix Seconds. We convert them to a normal Date string to compare.
          successToday = submissions.some((sub: any) => {
            const subDate = new Date(parseInt(sub.timestamp) * 1000).toISOString().split('T')[0];
            return subDate === todayStr;
          });
        }

        // ==========================================
        // 💾 DATABASE UPDATE LOGIC
        // ==========================================
        // If they did the work today AND we haven't already given them credit for it...
        if (successToday && streak.last_check_in !== todayStr) {
          
          // 1. Log it in the check_ins table (For the heatmap & Live Feed)
          await supabaseAdmin.from('check_ins').insert({
            streak_id: streak.id,
            user_id: streak.user_id,
            date_checked: todayStr
          });

          // 2. Update the main streak counter
          let newCount = streak.current_count;
          // If the streak was previously broken, start at 1. Otherwise, increment.
          if (streak.last_check_in && new Date(todayStr).getTime() - new Date(streak.last_check_in).getTime() > 86400000) {
            newCount = 1; 
          } else {
            newCount += 1;
          }

          await supabaseAdmin.from('streaks').update({
            current_count: newCount,
            last_check_in: todayStr,
            status: 'active'
          }).eq('id', streak.id);

          // Tally the successful updates for our logs
          if (streak.auto_sync_provider === 'github') syncResults.github++;
          if (streak.auto_sync_provider === 'leetcode') syncResults.leetcode++;
        }

      } catch (err) {
        console.error(`Error syncing streak ${streak.id}:`, err);
        syncResults.errors++;
        // We use a try/catch inside the loop so one broken username doesn't crash everyone else's sync!
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Midnight Sync Complete.',
      results: syncResults 
    });

  } catch (error) {
    console.error('Master Cron Error:', error);
    return NextResponse.json({ error: 'Critical Sync Failure' }, { status: 500 });
  }
}