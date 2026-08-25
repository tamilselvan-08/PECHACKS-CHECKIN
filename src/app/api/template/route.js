import { NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET() {
  try {
    let ext = 'png';
    const { blobs } = await list();
    const metaBlob = blobs.find(b => b.pathname === 'template.meta');
    if (metaBlob) {
      const metaRes = await fetch(metaBlob.downloadUrl || metaBlob.url);
      if (metaRes.ok) ext = await metaRes.text();
    }

    const templateName = `template.${ext}`;
    const templateBlob = blobs.find(b => b.pathname === templateName);
    if (!templateBlob) throw new Error("not found");

    const res = await fetch(templateBlob.downloadUrl || templateBlob.url);
    if (!res.ok) throw new Error("not found");
    const buffer = await res.arrayBuffer();

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
