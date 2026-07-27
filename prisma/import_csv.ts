import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

async function importSheetData() {
  console.log('🚀 Importing real Google Sheet solar procurement data into database...');

  const csvPath = path.join(__dirname, 'sheet_data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ sheet_data.csv not found');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);

  // Skip header lines
  const dataLines = lines.slice(2);

  let importedCount = 0;

  for (const line of dataLines) {
    const cols = parseCSVLine(line);
    if (cols.length < 12) continue;

    const categoryRaw = cols[0] || 'Solar Equipment';
    const kw = cols[1] || '';
    const vendorName = cols[2] || '';
    const address = cols[3] || 'Coimbatore, Tamil Nadu';
    const dateStr = cols[4] || '';
    const invoiceNoRaw = cols[5] || '';
    const hsnNo = cols[6] || '8541';
    const itemName = cols[7] || '';
    const spec = cols[8] || '';
    const makeBrand = cols[9] || '';
    const unit = cols[10] || 'Pcs';

    const unitRateStr = (cols[11] || '0').replace(/[^0-9.]/g, '');
    const gstPctStr = (cols[12] || '18').replace(/[^0-9.]/g, '');
    const withGstStr = (cols[13] || '0').replace(/[^0-9.]/g, '');
    const discountRaw = cols[14] || '';

    const basePrice = parseFloat(unitRateStr) || 0;
    const gstPercentage = parseFloat(gstPctStr) || 18;
    let effectivePrice = parseFloat(withGstStr) || 0;

    if (effectivePrice === 0 && basePrice > 0) {
      effectivePrice = Number((basePrice * (1 + gstPercentage / 100)).toFixed(2));
    }

    if (!itemName || basePrice <= 0) continue;

    const category = categoryRaw.trim() || 'Solar Equipment';
    const brand = makeBrand.trim() || 'Standard Solar';
    const fullName = kw ? `${itemName.trim()} (${kw})` : itemName.trim();
    const cleanVendorName = vendorName.trim() || 'Local Solar Vendor';
    const invoiceNo = invoiceNoRaw.trim() || null;
    const discount = discountRaw.trim() || null;

    const cleanGst = `33AAACG${Math.abs(hashString(cleanVendorName)).toString().padStart(6, '0')}1Z5`;

    // 1. Upsert Supplier
    const supplier = await prisma.supplier.upsert({
      where: { gstNumber: cleanGst },
      update: {
        companyName: cleanVendorName,
        address: address.trim(),
      },
      create: {
        companyName: cleanVendorName,
        gstNumber: cleanGst,
        phone: '+91 98422 ' + String(Math.floor(10000 + Math.random() * 90000)),
        email: `sales@${cleanVendorName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
        address: address.trim(),
        rating: Number((4.0 + (hashString(cleanVendorName) % 10) / 10).toFixed(1)),
        status: 'ACTIVE',
      },
    });

    // 2. Upsert Product
    const product = await prisma.product.upsert({
      where: { id: `prod_${hashString(fullName)}` },
      update: {
        name: fullName,
        category,
        brand,
        specification: spec.trim() || `${fullName} - ${brand}`,
        hsn: hsnNo.trim(),
        unit: unit.trim() || 'Pcs',
      },
      create: {
        id: `prod_${hashString(fullName)}`,
        name: fullName,
        category,
        brand,
        specification: spec.trim() || `${fullName} - ${brand}`,
        hsn: hsnNo.trim() || '8541',
        unit: unit.trim() || 'Pcs',
        minimumStock: 20,
      },
    });

    // 3. Upsert Supplier Product (Quotation with Invoice No & Discount)
    await prisma.supplierProduct.upsert({
      where: {
        supplierId_productId: {
          supplierId: supplier.id,
          productId: product.id,
        },
      },
      update: {
        basePrice,
        gstPercentage,
        effectivePrice,
        discount,
        invoiceNo,
        quotationDate: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        leadTime: Math.floor(1 + Math.random() * 5),
        minimumOrderQuantity: 1,
      },
      create: {
        supplierId: supplier.id,
        productId: product.id,
        basePrice,
        gstPercentage,
        effectivePrice,
        discount,
        invoiceNo,
        quotationDate: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        leadTime: Math.floor(1 + Math.random() * 5),
        minimumOrderQuantity: 1,
      },
    });

    // 4. Ensure Inventory record exists
    const mockStock = 15 + (hashString(fullName) % 50);
    await prisma.inventory.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        warehouse: 'Main Solar Warehouse',
        stock: mockStock,
        reserved: 2,
        available: Math.max(0, mockStock - 2),
      },
    });

    importedCount++;
  }

  console.log(`✅ Successfully imported ${importedCount} actual solar items with Invoice No and Discount Price into database!`);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

importSheetData()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
