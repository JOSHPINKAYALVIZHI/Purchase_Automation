import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const neonConnectionString = "postgresql://neondb_owner:npg_5kHGMgt9snyb@ep-bold-king-axacohp2.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

// Instantiate PrismaClient pointing to Neon connection string
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: neonConnectionString,
    },
  },
});

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

async function importToNeonDB() {
  console.log('🚀 Feeding Google Sheet solar data directly into NEON PostgreSQL DB...');

  const csvPath = path.join(__dirname, 'sheet_data.csv');
  if (!fs.existsSync(csvPath)) {
    console.error('❌ sheet_data.csv not found');
    return;
  }

  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split('\n').filter((l) => l.trim().length > 0);
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
    const totalStr = (cols[15] || '0').replace(/[^0-9.]/g, '');

    const basePrice = parseFloat(unitRateStr) || 0;
    const gstPercentage = parseFloat(gstPctStr) || 18;
    let effectivePrice = parseFloat(withGstStr) || 0;
    let totalAmount = parseFloat(totalStr) || 0;

    if (effectivePrice === 0 && basePrice > 0) {
      effectivePrice = Number((basePrice * (1 + gstPercentage / 100)).toFixed(2));
    }

    if (totalAmount === 0 && effectivePrice > 0) {
      totalAmount = effectivePrice;
    }

    if (!itemName || basePrice <= 0) continue;

    const category = categoryRaw.trim() || 'Solar Equipment';
    const brand = makeBrand.trim() || 'Standard Solar';
    const fullName = kw ? `${itemName.trim()} (${kw})` : itemName.trim();
    const cleanVendorName = vendorName.trim() || 'Local Solar Vendor';
    const invoiceNo = invoiceNoRaw.trim() || null;
    const discount = discountRaw.trim() || null;

    const cleanGst = `33AAACG${Math.abs(hashString(cleanVendorName)).toString().padStart(6, '0')}1Z5`;

    // 1. Upsert Supplier in Neon
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
        email: null,
        address: address.trim(),
        rating: Number((4.0 + (hashString(cleanVendorName) % 10) / 10).toFixed(1)),
        status: 'ACTIVE',
      },
    });

    // 2. Upsert Product in Neon
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

    // 3. Upsert SupplierProduct in Neon
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
        totalAmount,
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
        totalAmount,
        discount,
        invoiceNo,
        quotationDate: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        leadTime: Math.floor(1 + Math.random() * 5),
        minimumOrderQuantity: 1,
      },
    });

    importedCount++;
  }

  console.log(`✅ SUCCESS! Imported ${importedCount} actual solar procurement items into NEON PostgreSQL DB!`);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

importToNeonDB()
  .catch((e) => console.error('❌ Neon Import Error:', e))
  .finally(async () => await prisma.$disconnect());
