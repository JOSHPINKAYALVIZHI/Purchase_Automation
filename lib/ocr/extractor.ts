import pdfParse from 'pdf-parse';

export interface ExtractedQuotationData {
  supplierName: string | null;
  gstNumber: string | null;
  productName: string | null;
  category: string | null;
  basePrice: number | null;
  gstPercentage: number | null;
  effectivePrice: number | null;
  quantity: number | null;
  leadTime: number | null;
  validUntil: string | null;
  rawText: string;
  confidenceScore: number;
}

export async function parseQuotationDocument(fileBuffer: Buffer, fileName: string): Promise<ExtractedQuotationData> {
  let textContent = '';

  if (fileName.endsWith('.pdf')) {
    try {
      const pdfData = await pdfParse(fileBuffer);
      textContent = pdfData.text;
    } catch (e) {
      console.warn('PDF parsing error, using raw string representation:', e);
      textContent = fileBuffer.toString('utf-8');
    }
  } else {
    textContent = fileBuffer.toString('utf-8');
  }

  return extractQuotationMetadataFromText(textContent);
}

export function extractQuotationMetadataFromText(text: string): ExtractedQuotationData {
  const normalized = text.replace(/\r\n/g, '\n');

  // 1. GST Number regex: 2 digits + 5 alpha + 4 digits + 1 alpha + 1 char + Z + 1 char
  const gstRegex = /\b\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}\b/i;
  const gstMatch = normalized.match(gstRegex);
  const gstNumber = gstMatch ? gstMatch[0].toUpperCase() : null;

  // 2. Base Price regex: looking for ₹ / Rs / Rate / Unit Price / Price followed by numbers
  const priceRegex = /(?:base\s*price|unit\s*price|rate|price|amount|rs\.?|₹)\s*:?\s*₹?\s*([\d,]+(?:\.\d{1,2})?)/i;
  const priceMatch = normalized.match(priceRegex);
  let basePrice: number | null = null;
  if (priceMatch) {
    basePrice = parseFloat(priceMatch[1].replace(/,/g, ''));
  }

  // 3. GST Percentage regex: 5%, 12%, 18%, 28%
  const gstPctRegex = /(?:gst|igst|cgst\+sgst|tax)\s*@?\s*:?\s*(\d{1,2})\s*%/i;
  const gstPctMatch = normalized.match(gstPctRegex);
  let gstPercentage: number | null = null;
  if (gstPctMatch) {
    gstPercentage = parseFloat(gstPctMatch[1]);
  } else {
    // Default GST for solar panels/components is typically 12% or 18%
    gstPercentage = 12;
  }

  // 4. Quantity / MOQ regex
  const qtyRegex = /(?:qty|quantity|moq|minimum\s*order|units?)\s*:?\s*(\d+)/i;
  const qtyMatch = normalized.match(qtyRegex);
  const quantity = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

  // 5. Lead Time regex
  const leadTimeRegex = /(?:lead\s*time|delivery|dispatch|time)\s*:?\s*(\d+)\s*(?:days|day|hrs|weeks)?/i;
  const leadTimeMatch = normalized.match(leadTimeRegex);
  const leadTime = leadTimeMatch ? parseInt(leadTimeMatch[1], 10) : 3;

  // 6. Supplier Name detection
  let supplierName: string | null = null;
  const supplierMatch = normalized.match(/(?:from|supplier|vendor|company|biller)\s*:?\s*([A-Za-z0-9\s&.,]+(?:Ltd|Pvt|Inc|Corp|Technologies|Solar|Solutions))/i);
  if (supplierMatch) {
    supplierName = supplierMatch[1].trim();
  } else {
    // Check known supplier keywords
    if (/abc\s*solar/i.test(normalized)) supplierName = 'ABC Solar Technologies Ltd';
    else if (/sunpower/i.test(normalized)) supplierName = 'SunPower Components Pvt Ltd';
    else if (/rays\s*energy/i.test(normalized)) supplierName = 'Rays Energy Solutions';
    else if (/vertex/i.test(normalized)) supplierName = 'Vertex Photovoltaic Ltd';
    else if (/apex/i.test(normalized)) supplierName = 'Apex Solar Accessories';
  }

  // 7. Product Name detection
  let productName: string | null = null;
  let category: string | null = null;

  if (/550w/i.test(normalized) || /550\s*watt/i.test(normalized)) {
    productName = '550W Monocrystalline Solar Panel';
    category = 'Solar Panel';
  } else if (/540w/i.test(normalized)) {
    productName = '540W Monocrystalline Solar Panel';
    category = 'Solar Panel';
  } else if (/580w/i.test(normalized) || /bifacial/i.test(normalized)) {
    productName = '580W Bifacial Half-Cut Panel';
    category = 'Solar Panel';
  } else if (/mc4/i.test(normalized) || /connector/i.test(normalized)) {
    productName = 'MC4 Solar Connector Pair';
    category = 'Connectors';
  } else if (/dc\s*cable|4\s*sq\s*mm/i.test(normalized)) {
    productName = '4 sq mm Solar DC Cable (100m Roll)';
    category = 'Cables';
  } else if (/inverter|10kw/i.test(normalized)) {
    productName = '10kW 3-Phase Solar Grid Inverter';
    category = 'Inverter';
  } else if (/fuse|15a/i.test(normalized)) {
    productName = '15A 1000V DC Solar Fuse';
    category = 'Fuses & Protection';
  }

  // 8. Effective Price calculation
  const effectivePrice = basePrice ? Number((basePrice * (1 + (gstPercentage || 0) / 100)).toFixed(2)) : null;

  // Calculate confidence score (0 to 100)
  let detectedFields = 0;
  if (supplierName) detectedFields++;
  if (gstNumber) detectedFields++;
  if (productName) detectedFields++;
  if (basePrice) detectedFields++;
  if (gstPercentage !== null) detectedFields++;
  if (leadTime) detectedFields++;

  const confidenceScore = Math.min(100, Math.round((detectedFields / 6) * 100));

  const validUntilDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  return {
    supplierName,
    gstNumber,
    productName,
    category,
    basePrice,
    gstPercentage,
    effectivePrice,
    quantity,
    leadTime,
    validUntil: validUntilDate,
    rawText: text,
    confidenceScore,
  };
}
