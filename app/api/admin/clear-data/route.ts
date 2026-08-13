import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.supplierProduct.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.supplier.deleteMany({});

    return NextResponse.json({ success: true, message: 'All business data cleared successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
