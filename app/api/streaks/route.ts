import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Add CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function GET(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const { data: streaks, error } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'abandoned')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching streaks:', error);
      return NextResponse.json({ error: 'Failed to fetch streaks' }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ streaks }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in streaks API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS(request: Request) {
  return new Response(null, { 
    status: 204, 
    headers: corsHeaders 
  });
}