import { NextResponse } from 'next/server';
import { getTeams } from '@/lib/excel';
import path from 'path';
import fs from 'fs/promises';

export async function GET() {
  try {
    const excelPath = path.join(process.cwd(), 'data', 'participants.xlsx');
    try {
      await fs.access(excelPath);
    } catch {
      return NextResponse.json({ teams: [], error: 'No Excel file uploaded yet.' }, { status: 404 });
    }
    const teams = await getTeams(excelPath);
    return NextResponse.json({ teams });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to read Excel data' }, { status: 500 });
  }
}
