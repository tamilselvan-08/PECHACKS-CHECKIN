import { NextResponse } from 'next/server';
import { getTeams, updateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/email';
import path from 'path';
import fs from 'fs/promises';
import pLimit from 'p-limit';

export async function POST(request) {
  try {
    const { teamIds } = await request.json();
    if (!teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: 'Invalid teamIds' }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const excelPath = path.join(dataDir, 'participants.xlsx');
    
    let ext = 'png';
    try { ext = await fs.readFile(path.join(dataDir, 'template.meta'), 'utf-8'); } catch(e) {}
    const templatePath = path.join(dataDir, `template.${ext}`);
    const templateBuffer = await fs.readFile(templatePath);

    const teams = await getTeams(excelPath);
    
    const limit = pLimit(5); 
    let successCount = 0;
    let failCount = 0;

    const tasks = teamIds.map(teamId => limit(async () => {
      const team = teams.find(t => t.id === teamId);
      if (!team || !team.leadEmail) {
        failCount++;
        return;
      }
      
      try {
        const pdfBuffer = await generateTicketPdf(team, templateBuffer, ext);
        await updateTeamStatus(excelPath, teamId, { generated: true });
        
        await sendTicketEmail(team, pdfBuffer);
        await updateTeamStatus(excelPath, teamId, { 
          sentStatus: 'SENT', 
          sentAt: new Date().toLocaleString() 
        });
        successCount++;
      } catch (err) {
        console.error(`Bulk email failed for ${teamId}:`, err);
        await updateTeamStatus(excelPath, teamId, { sentStatus: 'FAILED' });
        failCount++;
      }
    }));

    await Promise.all(tasks);

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Bulk processing failed' }, { status: 500 });
  }
}
