import nodemailer from 'nodemailer';

export async function sendTicketEmail(team, pdfBuffer) {
  // Read SMTP settings from ENV
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.MAIL_FROM;
  const fromName = process.env.MAIL_FROM_NAME || 'Hackathon Organizer';

  if (!host || !user || !pass || !fromEmail) {
    throw new Error('SMTP credentials are not fully configured in environment variables.');
  }

  const transporter = nodemailer.createTransport({
    host,
    port: parseInt(port),
    secure: parseInt(port) === 465, 
    auth: { user, pass }
  });

  let subject = `Your Team Ticket — ${team.name} (${team.id})`;
  const eventDate = process.env.EVENT_DATE || 'the event date';
  const eventName = process.env.EVENT_NAME || 'Our Hackathon';
  
  let html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #3b82f6;">Your official team ticket is here!</h2>
      <p>Dear <strong>${team.leadName || 'Team Lead'}</strong>,</p>
      <p>Your team has been successfully registered for <strong>${eventName}</strong>.</p>
      
      <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 20px 0;">
        <p style="margin: 0;"><strong>Team Name:</strong> ${team.name}</p>
        <p style="margin: 0;"><strong>Team ID:</strong> ${team.id}</p>
        <p style="margin: 0;"><strong>Event Date:</strong> ${eventDate}</p>
      </div>

      <p>Please find your official team ticket attached to this email as a PDF.</p>
      
      <p style="color: #ef4444; font-weight: bold;">
        IMPORTANT: ONE TICKET REPRESENTS THE ENTIRE TEAM.
      </p>
      <p>
        As the team lead, please keep this ticket accessible and present the QR code at the check-in desk during the event. 
        When your QR code is scanned, your entire team will be pulled up for individual check-in.
      </p>

      <p>Regards,<br/><strong>${eventName} Organizing Team</strong></p>
    </div>
  `;

  try {
    const fs = require('fs/promises');
    const path = require('path');
    const configPath = path.join(process.cwd(), 'data', 'emailConfig.json');
    const configData = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(configData);

    if (config.subject) {
      subject = config.subject
        .replaceAll('{{teamName}}', team.name || '')
        .replaceAll('{{teamId}}', team.id || '')
        .replaceAll('{{leadName}}', team.leadName || 'Team Lead')
        .replaceAll('{{eventName}}', eventName)
        .replaceAll('{{eventDate}}', eventDate);
    }
    
    if (config.html) {
      html = config.html
        .replaceAll('{{teamName}}', team.name || '')
        .replaceAll('{{teamId}}', team.id || '')
        .replaceAll('{{leadName}}', team.leadName || 'Team Lead')
        .replaceAll('{{eventName}}', eventName)
        .replaceAll('{{eventDate}}', eventDate);
    }
  } catch (e) {
    // Fall back to default if file doesn't exist
  }

  const fileName = `${eventName.replace(/\\s+/g, '-')}-${team.id}-${team.name.replace(/\\s+/g, '-')}.pdf`;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: team.leadEmail,
    subject: subject,
    html: html,
    attachments: [
      {
        filename: fileName,
        content: pdfBuffer,
        contentType: 'application/pdf'
      }
    ]
  };

  const info = await transporter.sendMail(mailOptions);
  return info;
}
