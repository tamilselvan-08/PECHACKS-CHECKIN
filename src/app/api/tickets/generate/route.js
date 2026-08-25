import { NextResponse } from 'next/server';
import { getTeams, updateTeamStatus } from '@/lib/excel';
import { generateTicketPdf } from '@/lib/pdf';
import path from 'path';
import fs from 'fs/promises';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');
    if (!teamId) return new NextResponse('Missing teamId', { status: 400 });

    const dataDir = path.join(process.cwd(), 'data');
    const excelPath = path.join(dataDir, 'participants.xlsx');
    
    let ext = 'png';
    try {
      ext = await fs.readFile(path.join(dataDir, 'template.meta'), 'utf-8');
    } catch(e) {}
    
    const templatePath = path.join(dataDir, `template.${ext}`);

    let templateBuffer;
    try {
      templateBuffer = await fs.readFile(templatePath);
    } catch {
      return new NextResponse('Template image not uploaded', { status: 404 });
    }

    const teams = await getTeams(excelPath);
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
