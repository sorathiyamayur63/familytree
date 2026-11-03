// ============================================================
// API Route — /api/nodes
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { DataService, DEFAULT_TREE_ID } from '@/lib/dataService';

export async function GET(req: NextRequest) {
  const treeId = req.nextUrl.searchParams.get('treeId') || DEFAULT_TREE_ID;
  try {
    const nodes = await DataService.getNodes(treeId);
    return NextResponse.json({ success: true, data: nodes });
  } catch (err) {
    console.error('API /api/nodes GET error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const node = await DataService.createNode(body);
    return NextResponse.json({ success: true, data: node }, { status: 201 });
  } catch (err) {
    console.error('API /api/nodes POST error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}

// Bulk update / import
export async function PUT(req: NextRequest) {
  try {
    const { treeId, nodes } = await req.json();
    if (!treeId || !Array.isArray(nodes)) {
      return NextResponse.json({ success: false, error: 'treeId and nodes required' }, { status: 400 });
    }
    const saved = await DataService.bulkSaveNodes(treeId, nodes);
    return NextResponse.json({ success: true, data: saved });
  } catch (err) {
    console.error('API /api/nodes PUT error:', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
