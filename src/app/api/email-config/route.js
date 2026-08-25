import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const configPath = path.join(process.cwd(), 'data', 'emailConfig.json');

const defaultSubject = 'Your Team Ticket — {{teamName}} ({{teamId}})';

const defaultHtml = `
<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <h2 style="color: #3b82f6;">Your official team ticket is here!</h2>
  <p>Dear <strong>{{leadName}}</strong>,</p>
  <p>Your team has been successfully registered for <strong>{{eventName}}</strong>.</p>
  
  <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
    <p style="margin: 0;"><strong>Team Name:</strong> {{teamName}}</p>
    <p style="margin: 0;"><strong>Team ID:</strong> {{teamId}}</p>
    <p style="margin: 0;"><strong>Event Date:</strong> {{eventDate}}</p>
  </div>

  <p>Please find your official team ticket attached to this email as a PDF.</p>
  
  <p style="color: #ef4444; font-weight: bold;">
    IMPORTANT: ONE TICKET REPRESENTS THE ENTIRE TEAM.
  </p>
  <p>
    As the team lead, please keep this ticket accessible and present the QR code at the check-in desk during the event. 
    When your QR code is scanned, your entire team will be pulled up for individual check-in.
  </p>

  <p>Regards,<br/><strong>{{eventName}} Organizing Team</strong></p>
</div>
`;

export async function GET() {
  try {
    const data = await fs.readFile(configPath, 'utf-8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    if (error.code === 'ENOENT') {
      const defaultConfig = {
        subject: defaultSubject,
        html: defaultHtml
      };
      // Try to create the data directory if it doesn't exist
      try { await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true }); } catch (e) {}
      await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
      return NextResponse.json(defaultConfig);
    }
    return NextResponse.json({ error: 'Failed to read email config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.subject || !data.html) {
      return NextResponse.json({ error: 'Missing subject or html content' }, { status: 400 });
    }
    
    // Try to create the data directory if it doesn't exist
    try { await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true }); } catch (e) {}
    await fs.writeFile(configPath, JSON.stringify({ subject: data.subject, html: data.html }, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save email config' }, { status: 500 });
  }
}
