import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    let ext = 'png';
    try {
      ext = await fs.readFile(path.join(dataDir, 'template.meta'), 'utf-8');
    } catch (e) {}

    const templatePath = path.join(dataDir, `template.${ext}`);
    const buffer = await fs.readFile(templatePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': `image/${ext === 'jpg' ? 'jpeg' : ext}`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    return new NextResponse('Template not found', { status: 404 });
  }
}
