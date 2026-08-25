import { NextResponse } from 'next/server';
import { getTeams, batchUpdateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import { sendTicketEmail } from '@/lib/email';
import pLimit from 'p-limit';
import { list } from '@vercel/blob';

export async function POST(request) {
  try {
    const { teamIds } = await request.json();
    if (!teamIds || !Array.isArray(teamIds)) {
      return NextResponse.json({ error: 'Invalid teamIds' }, { status: 400 });
    }

    // Get template meta and buffer from Blob
    let ext = 'png';
    const { blobs } = await list();
    const metaBlob = blobs.find(b => b.pathname === 'template.meta');
    if (metaBlob) {
      const metaRes = await fetch(metaBlob.downloadUrl || metaBlob.url);
      if (metaRes.ok) ext = await metaRes.text();
    }
    
    const templateName = `template.${ext}`;
    const templateBlob = blobs.find(b => b.pathname === templateName);
    if (!templateBlob) {
      throw new Error("Template image not found in Blob storage");
    }
    const templateRes = await fetch(templateBlob.downloadUrl || templateBlob.url);
    if (!templateRes.ok) throw new Error("Failed to fetch template image");
    const templateBuffer = Buffer.from(await templateRes.arrayBuffer());

    const teams = await getTeams(); // no longer needs excelPath
    
    const limit = pLimit(5); 
    let successCount = 0;
    let failCount = 0;
    
    const updatesArray = [];

    const tasks = teamIds.map(teamId => limit(async () => {
      const team = teams.find(t => t.id === teamId);
      if (!team || !team.leadEmail) {
        failCount++;
        return;
      }
      
      try {
        const pdfBuffer = await generateTicketPdf(team, templateBuffer, ext);
        
        await sendTicketEmail(team, pdfBuffer);
        
        updatesArray.push({
          teamId,
          updates: {
            generated: true,
            sentStatus: 'SENT',
            sentAt: new Date().toLocaleString()
          }
        });
        successCount++;
      } catch (err) {
        console.error(`Bulk email failed for ${teamId}:`, err);
        updatesArray.push({
          teamId,
          updates: {
            sentStatus: 'FAILED'
          }
        });
        failCount++;
      }
    }));

    await Promise.all(tasks);

    if (updatesArray.length > 0) {
      await batchUpdateTeamStatus(null, updatesArray);
    }

    return NextResponse.json({ success: true, successCount, failCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Bulk processing failed' }, { status: 500 });
  }
}
