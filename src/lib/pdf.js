import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import { list } from '@vercel/blob';

// Helper to convert hex color to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ) : rgb(0,0,0);
}

export async function generateTicketPdf(team, templateImageBuffer, imageType = 'png') {
  const pdfDoc = await PDFDocument.create();
  
  let image = imageType === 'jpg' || imageType === 'jpeg' 
    ? await pdfDoc.embedJpg(templateImageBuffer) 
    : await pdfDoc.embedPng(templateImageBuffer);
  
  const { width, height } = image.scale(1);
  const page = pdfDoc.addPage([width, height]);
  
  page.drawImage(image, { x: 0, y: 0, width, height });

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  let config;
  try {
    const { blobs } = await list({ prefix: 'ticketConfig.json' });
    const blob = blobs.find(b => b.pathname === 'ticketConfig.json');
    if (blob) {
      const res = await fetch(blob.downloadUrl || blob.url);
      if (res.ok) {
        config = await res.json();
      } else {
        throw new Error('Fetch failed');
      }
    } else {
      throw new Error('Not found');
    }
  } catch {
    // Default config
    config = {
      teamName: { x: 10, y: 15, size: 24, color: '#000000', visible: true },
      teamId: { x: 10, y: 25, size: 20, color: '#333333', visible: true },
      membersTitle: { x: 10, y: 40, size: 16, color: '#000000', visible: true },
      membersList: { x: 10, y: 45, size: 14, color: '#111111', visible: true },
      qrCode: { x: 75, y: 75, size: 150, visible: true },
    };
  }

  // PDF-lib coordinates start from Bottom-Left. Our config Y is from Top-Left.
  // We use 0.8 * size as the baseline offset to closely match CSS line-height: 1 visual rendering.
  if (config.teamName.visible) {
    const y = height - (config.teamName.y / 100 * height) - (config.teamName.size * 0.8);
    page.drawText(team.name, { 
      x: (config.teamName.x / 100 * width), y, 
      size: config.teamName.size, font, color: hexToRgb(config.teamName.color) 
    });
  }

  if (config.teamId.visible) {
    const y = height - (config.teamId.y / 100 * height) - (config.teamId.size * 0.8);
    page.drawText(team.id, { 
      x: (config.teamId.x / 100 * width), y, 
      size: config.teamId.size, font, color: hexToRgb(config.teamId.color) 
    });
  }

  if (config.domain?.visible) {
    const getDomain = (teamId) => {
      if (!teamId) return '';
      const letter = teamId.charAt(0).toUpperCase();
      switch (letter) {
        case 'E': return 'Edutech';
        case 'H': return 'Healthcare';
        case 'F': return 'Fintech';
        case 'O': return 'Open Track';
        case 'S': return 'Sustainability';
        default: return 'General';
      }
    };
    
    const domainName = getDomain(team.id);
    const y = height - (config.domain.y / 100 * height) - (config.domain.size * 0.8);
    page.drawText(domainName, { 
      x: (config.domain.x / 100 * width), y, 
      size: config.domain.size, font, color: hexToRgb(config.domain.color) 
    });
  }

  if (config.membersTitle.visible) {
    const y = height - (config.membersTitle.y / 100 * height) - (config.membersTitle.size * 0.8);
    page.drawText(`Members:`, { 
      x: (config.membersTitle.x / 100 * width), y, 
      size: config.membersTitle.size, font, color: hexToRgb(config.membersTitle.color) 
    });
  }

  // Draw Lead Name explicitly if enabled
  const leadMember = team.members.find(m => m.isLead) || team.members[0];
  if (config.leadName?.visible && leadMember) {
    const y = height - (config.leadName.y / 100 * height) - (config.leadName.size * 0.8);
    page.drawText(leadMember.name, { 
      x: (config.leadName.x / 100 * width), y, 
      size: config.leadName.size, font, color: hexToRgb(config.leadName.color) 
    });
  }

  // Draw Members List (Excluding the Lead if drawn separately, or just exclude Lead anyway based on logic)
  if (config.membersList.visible) {
    // Use 0.8 * size as the baseline offset for consistency with other elements
    let y = height - (config.membersList.y / 100 * height) - (config.membersList.size * 0.8);
    const x = config.membersList.x / 100 * width;
    
    // Filter out the lead from the generic members list
    const nonLeadMembers = team.members.filter(m => m !== leadMember);
    
    nonLeadMembers.forEach((member, idx) => {
      const text = `${idx + 1}. ${member.name}`;
      page.drawText(text, { 
        x, y, 
        size: config.membersList.size, font: regularFont, color: hexToRgb(config.membersList.color) 
      });
      y -= (config.membersList.size * 1.5);
    });
  }

  if (config.qrCode.visible) {
    const qrDataUrl = await QRCode.toDataURL(`TEAM:${team.id}`, { margin: 1, width: config.qrCode.size });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrBuffer = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    
    const y = height - (config.qrCode.y / 100 * height) - config.qrCode.size;
    page.drawImage(qrImage, {
      x: (config.qrCode.x / 100 * width),
      y,
      width: config.qrCode.size,
      height: config.qrCode.size,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
