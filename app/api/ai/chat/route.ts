import { NextRequest, NextResponse } from 'next/server';
import { processAIChatQuery } from '@/lib/ai/recommendation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.query) {
      return NextResponse.json({ success: false, error: 'query parameter is required' }, { status: 400 });
    }

    const response = await processAIChatQuery(body.query);
    return NextResponse.json({ success: true, data: response });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
