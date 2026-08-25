import { NextResponse } from 'next/server';
import { checkInTeam } from '@/lib/excel';

export async function POST(request) {
  try {
    const { teamId, presentMembers } = await request.json();

    if (!teamId || !presentMembers || !Array.isArray(presentMembers)) {
      return NextResponse.json({ success: false, error: 'Missing teamId or presentMembers array' }, { status: 400 });
    }

    const count = await checkInTeam(null, teamId, presentMembers);

    if (count > 0) {
      return NextResponse.json({ success: true, message: `Successfully checked in ${count} members for Team ${teamId}` });
    } else {
      return NextResponse.json({ success: false, error: 'Team ID not found or no matching members.' }, { status: 404 });
    }
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
