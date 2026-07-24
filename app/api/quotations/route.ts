import { NextRequest, NextResponse } from 'next/server';
import { upsertSupplierQuotation, compareSupplierPrices } from '@/lib/actions/suppliers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId parameter is required' }, { status: 400 });
    }

    const comparison = await compareSupplierPrices(productId);
    return NextResponse.json({ success: true, data: comparison });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const quotation = await upsertSupplierQuotation(body);
    return NextResponse.json({ success: true, data: quotation }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
