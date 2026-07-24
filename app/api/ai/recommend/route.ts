import { NextRequest, NextResponse } from 'next/server';
import { getAISupplierRecommendations } from '@/lib/ai/recommendation';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ success: false, error: 'productId is required' }, { status: 400 });
    }

    const priceWeight = searchParams.get('priceWeight') ? parseFloat(searchParams.get('priceWeight')!) : undefined;
    const leadTimeWeight = searchParams.get('leadTimeWeight') ? parseFloat(searchParams.get('leadTimeWeight')!) : undefined;
    const ratingWeight = searchParams.get('ratingWeight') ? parseFloat(searchParams.get('ratingWeight')!) : undefined;

    const recommendations = await getAISupplierRecommendations(productId, {
      priceWeight,
      leadTimeWeight,
      ratingWeight,
    });

    return NextResponse.json({ success: true, count: recommendations.length, data: recommendations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
