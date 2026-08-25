import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import lockfile from 'proper-lockfile';

export async function GET() {
  const dataDir = path.join(process.cwd(), 'data');
  const filePath = path.join(dataDir, 'participants.xlsx');

  let release;
  try {
    release = await lockfile.lock(filePath, { retries: { retries: 5, minTimeout: 100, maxTimeout: 500 } });
    const fileBuffer = await fs.readFile(filePath);
    
    // We must return a proper binary response
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="participants-checkin-export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    if (error.code === 'ENOENT') {
      return NextResponse.json({ success: false, error: 'No Excel file found. Upload one first.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (release) await release();
  }
}
