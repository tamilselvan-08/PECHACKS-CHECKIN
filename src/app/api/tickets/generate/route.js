import { NextResponse } from 'next/server';
import { getTeams, updateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import { list } from '@vercel/blob';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) return new NextResponse('Missing teamId', { status: 400 });

    let ext = 'png';
    const { blobs } = await list();
    const metaBlob = blobs.find(b => b.pathname === 'template.meta');
    if (metaBlob) {
      const metaRes = await fetch(metaBlob.downloadUrl || metaBlob.url);
      if (metaRes.ok) ext = await metaRes.text();
    }
    
    const templateName = `template.${ext}`;
    const templateBlob = blobs.find(b => b.pathname === templateName);
    if (!templateBlob) return new NextResponse('Template image not uploaded', { status: 404 });
    
    const templateRes = await fetch(templateBlob.downloadUrl || templateBlob.url);
    if (!templateRes.ok) throw new Error("Failed to fetch template image");
    const templateBuffer = Buffer.from(await templateRes.arrayBuffer());

    const teams = await getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) return new NextResponse('Team not found', { status: 404 });

    const pdfBuffer = await generateTicketPdf(team, templateBuffer, ext);
    
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="Ticket-${teamId}.pdf"`
      }
    });
  } catch (error) {
    console.error(error);
    return new NextResponse('Failed to generate ticket', { status: 500 });
  }
}
