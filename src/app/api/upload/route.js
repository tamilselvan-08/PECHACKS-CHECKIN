import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';

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

    let fileName = '';
    if (type === 'excel') {
      fileName = 'participants.xlsx';
    } else if (type === 'template') {
      const ext = file.name.split('.').pop();
      fileName = `template.${ext}`;
      await put('template.meta', ext, { access: 'public', addRandomSuffix: false, allowOverwrite: true });
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    await put(fileName, buffer, { access: 'public', addRandomSuffix: false, allowOverwrite: true });

    return NextResponse.json({ success: true, message: 'Uploaded successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
