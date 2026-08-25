import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const configPath = path.join(dataDir, 'ticketConfig.json');
    
    const defaultConfig = {
      teamName: { x: 10, y: 15, size: 24, color: '#000000', visible: true },
      teamId: { x: 10, y: 25, size: 20, color: '#333333', visible: true },
      domain: { x: 10, y: 30, size: 18, color: '#000000', visible: true },
      leadName: { x: 10, y: 35, size: 18, color: '#000000', visible: true },
      membersTitle: { x: 10, y: 45, size: 16, color: '#000000', visible: true },
      membersList: { x: 10, y: 50, size: 14, color: '#111111', visible: true },
      qrCode: { x: 75, y: 75, size: 150, visible: true },
    };
    
    try {
      const data = await fs.readFile(configPath, 'utf-8');
      const savedConfig = JSON.parse(data);
      
      // Merge default with saved so new properties like leadName show up
      const mergedConfig = { ...defaultConfig };
      for (const key in savedConfig) {
        if (mergedConfig[key]) {
          mergedConfig[key] = { ...mergedConfig[key], ...savedConfig[key] };
        }
      }
      return NextResponse.json(mergedConfig);
    } catch {
      return NextResponse.json(defaultConfig);
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read config' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const config = await request.json();
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    
    const configPath = path.join(dataDir, 'ticketConfig.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save config' }, { status: 500 });
  }
}
