import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const type = formData.get('type'); // 'excel' or 'template'
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    let fileName = '';
    if (type === 'excel') {
      fileName = 'participants.xlsx';
    } else if (type === 'template') {
      const ext = file.name.split('.').pop();
      fileName = `template.${ext}`;
      await fs.writeFile(path.join(dataDir, 'template.meta'), ext);
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    const filePath = path.join(dataDir, fileName);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ success: true, message: 'Uploaded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
