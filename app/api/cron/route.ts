import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ⚠️ CRITICAL: Must use the SERVICE ROLE KEY, not the ANON KEY!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized intruder detected.' }, { status: 401 });
  }

  const todayStr = new Date().toISOString().split('T')[0]; 
  let syncResults = { github: 0, leetcode: 0, errors: 0 };

  try {
    const { data: streaks } = await supabaseAdmin
      .from('streaks')
      .select('id, current_count, last_check_in, user_id, auto_sync_provider, profiles!inner(github_username, leetcode_username)')
      .not('auto_sync_provider', 'is', null);

    if (!streaks || streaks.length === 0) {
      return NextResponse.json({ message: 'No automated streaks to process today.' });
    }

    for (const streak of streaks) {
      try {
        let successToday = false;

        // 🔥 THE FIX: Safely extract the profile to make TypeScript happy
        const profile: any = Array.isArray(streak.profiles) ? streak.profiles[0] : streak.profiles;

        // ==========================================
        // 🐙 GITHUB FETCH LOGIC
        // ==========================================
        if (streak.auto_sync_provider === 'github' && profile?.github_username) {
          const githubUser = profile.github_username;
          
          const res = await fetch(`https://api.github.com/users/${githubUser}/events/public`, { cache: 'no-store' });
          if (!res.ok) throw new Error(`GitHub API error for ${githubUser}`);
          
          const events = await res.json();
          successToday = events.some((event: any) => {
            return event.type === 'PushEvent' && event.created_at.startsWith(todayStr);
          });
        }

        // ==========================================
        // 💻 LEETCODE FETCH LOGIC
        // ==========================================
        if (streak.auto_sync_provider === 'leetcode' && profile?.leetcode_username) {
          const lcUser = profile.leetcode_username;
          
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

          successToday = submissions.some((sub: any) => {
            const subDate = new Date(parseInt(sub.timestamp) * 1000).toISOString().split('T')[0];
            return subDate === todayStr;
          });
        }

        // ==========================================
        // 💾 DATABASE UPDATE LOGIC
        // ==========================================
        if (successToday && streak.last_check_in !== todayStr) {
          await supabaseAdmin.from('check_ins').insert({
            streak_id: streak.id,
            user_id: streak.user_id,
            date_checked: todayStr
          });

          let newCount = streak.current_count;
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

          if (streak.auto_sync_provider === 'github') syncResults.github++;
          if (streak.auto_sync_provider === 'leetcode') syncResults.leetcode++;
        }

      } catch (err) {
        console.error(`Error syncing streak ${streak.id}:`, err);
        syncResults.errors++;
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