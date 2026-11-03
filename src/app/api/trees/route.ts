// ============================================================
// API Route — /api/trees
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET() {
  try {
    const trees = await DataService.getTrees();
    return NextResponse.json({ success: true, data: trees });
  } catch (err) {
    console.error('API /api/trees GET error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tree = await DataService.createTree(body);
    return NextResponse.json({ success: true, data: tree }, { status: 201 });
  } catch (err) {
    console.error('API /api/trees POST error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
