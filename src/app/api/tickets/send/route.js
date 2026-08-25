import { NextResponse } from 'next/server';
import { getTeams, updateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/email';
import { list } from '@vercel/blob';

export async function POST(request) {
  try {
    const { teamId } = await request.json();
    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });

    let ext = 'png';
    const { blobs } = await list();
    const metaBlob = blobs.find(b => b.pathname === 'template.meta');
    if (metaBlob) {
      const metaRes = await fetch(metaBlob.downloadUrl || metaBlob.url);
      if (metaRes.ok) ext = await metaRes.text();
    }
    
    const templateName = `template.${ext}`;
    const templateBlob = blobs.find(b => b.pathname === templateName);
    if (!templateBlob) return NextResponse.json({ error: 'Template image not uploaded' }, { status: 404 });
    
    const templateRes = await fetch(templateBlob.downloadUrl || templateBlob.url);
    if (!templateRes.ok) throw new Error("Failed to fetch template image");
    const templateBuffer = Buffer.from(await templateRes.arrayBuffer());

    const teams = await getTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (!team.leadEmail) return NextResponse.json({ error: 'No lead email found' }, { status: 400 });

    const pdfBuffer = await generateTicketPdf(team, templateBuffer, ext);
    await updateTeamStatus(null, teamId, { generated: true });

    try {
      await sendTicketEmail(team, pdfBuffer);
      await updateTeamStatus(null, teamId, { 
        sentStatus: 'SENT', 
        sentAt: new Date().toLocaleString() 
      });
      return NextResponse.json({ success: true, message: 'Ticket sent successfully' });
    } catch (emailError) {
      console.error(emailError);
      await updateTeamStatus(null, teamId, { sentStatus: 'FAILED' });
      return NextResponse.json({ error: 'Email sending failed: ' + emailError.message }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process ticket' }, { status: 500 });
  }
}
