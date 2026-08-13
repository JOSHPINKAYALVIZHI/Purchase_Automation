import { NextRequest, NextResponse } from 'next/server';
import { getSuppliers, createSupplier, updateSupplierContact } from '@/lib/actions/suppliers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;

    const suppliers = await getSuppliers({ search, status });
    return NextResponse.json({ success: true, count: suppliers.length, data: suppliers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await createSupplier(body);
    return NextResponse.json({ success: true, data: supplier }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, companyName, contactPerson, phone, email } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Supplier ID is required' }, { status: 400 });
    }
    const updated = await updateSupplierContact(id, { companyName, contactPerson, phone, email });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
