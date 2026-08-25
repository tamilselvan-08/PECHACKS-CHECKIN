import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    const { blobs } = await list({ prefix: 'participants.xlsx' });
    const blob = blobs.find(b => b.pathname === 'participants.xlsx');
    if (!blob) throw new Error("not found");
    
    const res = await fetch(blob.downloadUrl || blob.url);
    if (!res.ok) throw new Error("Failed to fetch excel file from Blob storage");
    
    const fileBuffer = await res.arrayBuffer();
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="participants-checkin-export.xlsx"',
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    if (error.message.includes('not found')) {
      return NextResponse.json({ success: false, error: 'No Excel file found. Upload one first.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
