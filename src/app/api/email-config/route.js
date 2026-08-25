import { NextResponse } from 'next/server';
import { list, put } from '@vercel/blob';

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
    const { blobs } = await list({ prefix: 'emailConfig.json' });
    const blob = blobs.find(b => b.pathname === 'emailConfig.json');
    if (blob) {
      const res = await fetch(blob.downloadUrl || blob.url);
      if (res.ok) {
        return NextResponse.json(await res.json());
      }
    }
    
    return NextResponse.json({ subject: defaultSubject, html: defaultHtml });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read email config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    if (!data.subject || !data.html) {
      return NextResponse.json({ error: 'Missing subject or html content' }, { status: 400 });
    }
    
    await put('emailConfig.json', JSON.stringify({ subject: data.subject, html: data.html }, null, 2), { access: 'public', addRandomSuffix: false });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save email config' }, { status: 500 });
  }
}
