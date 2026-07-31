import { NextRequest, NextResponse } from 'next/server';
import { getProducts, addFullProductQuote } from '@/lib/actions/products';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const brand = searchParams.get('brand') || undefined;

    const products = await getProducts({ search, category, brand });
    return NextResponse.json({ success: true, count: products.length, data: products });
  } catch (error: any) {
    console.error('❌ GET /api/products Error:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await addFullProductQuote(body);
    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    console.error('❌ POST /api/products Error:', error);
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 400 });
  }
}
