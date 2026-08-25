import { NextResponse } from 'next/server';
import { getTeams, updateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/email';
import path from 'path';
import fs from 'fs/promises';

export async function POST(request) {
  try {
    const { teamId } = await request.json();
    if (!teamId) return NextResponse.json({ error: 'Missing teamId' }, { status: 400 });

    const dataDir = path.join(process.cwd(), 'data');
    const excelPath = path.join(dataDir, 'participants.xlsx');
    
    let ext = 'png';
    try { ext = await fs.readFile(path.join(dataDir, 'template.meta'), 'utf-8'); } catch(e) {}
    const templatePath = path.join(dataDir, `template.${ext}`);
    const templateBuffer = await fs.readFile(templatePath);

    const teams = await getTeams(excelPath);
    const team = teams.find(t => t.id === teamId);
    if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
    if (!team.leadEmail) return NextResponse.json({ error: 'No lead email found' }, { status: 400 });

    const pdfBuffer = await generateTicketPdf(team, templateBuffer, ext);
    await updateTeamStatus(excelPath, teamId, { generated: true });

    try {
      await sendTicketEmail(team, pdfBuffer);
      await updateTeamStatus(excelPath, teamId, { 
        sentStatus: 'SENT', 
        sentAt: new Date().toLocaleString() 
      });
      return NextResponse.json({ success: true, message: 'Ticket sent successfully' });
    } catch (emailError) {
      console.error(emailError);
      await updateTeamStatus(excelPath, teamId, { sentStatus: 'FAILED' });
      return NextResponse.json({ error: 'Email sending failed: ' + emailError.message }, { status: 500 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to process ticket' }, { status: 500 });
  }
}
