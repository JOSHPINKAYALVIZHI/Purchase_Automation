import { NextRequest, NextResponse } from 'next/server';
import { parseQuotationDocument, extractQuotationMetadataFromText } from '@/lib/ocr/extractor';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file uploaded' }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const extracted = await parseQuotationDocument(buffer, file.name);
      return NextResponse.json({ success: true, data: extracted });
    } else {
      // JSON text payload fallback for raw text input OCR
      const body = await request.json();
      if (!body.text) {
        return NextResponse.json({ success: false, error: 'Text content required for extraction' }, { status: 400 });
      }

      const extracted = extractQuotationMetadataFromText(body.text);
      return NextResponse.json({ success: true, data: extracted });
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
