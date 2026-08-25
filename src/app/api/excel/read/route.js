import { NextResponse } from 'next/server';
import { getTeams } from '@/lib/excel';

export async function GET() {
  try {
    const teams = await getTeams();
    return NextResponse.json({ teams });
  } catch (error) {
    if (error.message.includes('not found')) {
      return NextResponse.json({ teams: [], error: 'No Excel file uploaded yet.' }, { status: 404 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Failed to read Excel data' }, { status: 500 });
  }
}
