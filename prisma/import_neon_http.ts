import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';

const neonConnectionString = "postgresql://neondb_owner:npg_5kHGMgt9snyb@ep-bold-king-axacohp2.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({ connectionString: neonConnectionString });

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

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function createTablesAndImport() {
  console.log('🚀 Creating tables and feeding Google Sheet data into NEON PostgreSQL DB over Port 443...');

  // 1. Create Tables DDL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "Supplier" (
      "id" TEXT PRIMARY KEY,
      "companyName" TEXT NOT NULL,
      "gstNumber" TEXT UNIQUE NOT NULL,
      "phone" TEXT NOT NULL,
      "email" TEXT,
      "address" TEXT NOT NULL,
      "rating" DOUBLE PRECISION DEFAULT 4.0,
      "status" TEXT DEFAULT 'ACTIVE',
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "brand" TEXT NOT NULL,
      "specification" TEXT NOT NULL,
      "hsn" TEXT NOT NULL,
      "unit" TEXT DEFAULT 'Pcs',
      "minimumStock" INT DEFAULT 20,
      "image" TEXT,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "SupplierProduct" (
      "id" TEXT PRIMARY KEY,
      "supplierId" TEXT NOT NULL REFERENCES "Supplier"("id") ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
      "basePrice" DOUBLE PRECISION NOT NULL,
      "gstPercentage" DOUBLE PRECISION NOT NULL,
      "effectivePrice" DOUBLE PRECISION NOT NULL,
      "totalAmount" DOUBLE PRECISION,
      "discount" TEXT,
      "invoiceNo" TEXT,
      "quotationDate" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "validUntil" TIMESTAMP(3) NOT NULL,
      "leadTime" INT NOT NULL,
      "minimumOrderQuantity" INT DEFAULT 1,
      "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SupplierProduct_supplierId_productId_key" UNIQUE ("supplierId", "productId")
    );
  `);

  console.log('✅ NEON DB Tables Created Successfully!');

  // 2. Read sheet CSV
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
    const supplierId = `sup_${hashString(cleanVendorName)}`;
    const productId = `prod_${hashString(fullName)}`;
    const supplierProductId = `sp_${hashString(supplierId + '_' + productId)}`;
    const cleanGst = `33AAACG${Math.abs(hashString(cleanVendorName)).toString().padStart(6, '0')}1Z5`;
    const phone = '+91 98422 ' + String(Math.floor(10000 + Math.random() * 90000));
    const rating = Number((4.0 + (hashString(cleanVendorName) % 10) / 10).toFixed(1));

    // Upsert Supplier
    await pool.query(
      `INSERT INTO "Supplier" ("id", "companyName", "gstNumber", "phone", "email", "address", "rating", "status")
       VALUES ($1, $2, $3, $4, NULL, $5, $6, 'ACTIVE')
       ON CONFLICT ("gstNumber") DO UPDATE SET "companyName" = EXCLUDED."companyName", "address" = EXCLUDED."address"`,
      [supplierId, cleanVendorName, cleanGst, phone, address.trim(), rating]
    );

    // Upsert Product
    await pool.query(
      `INSERT INTO "Product" ("id", "name", "category", "brand", "specification", "hsn", "unit", "minimumStock")
       VALUES ($1, $2, $3, $4, $5, $6, $7, 20)
       ON CONFLICT ("id") DO UPDATE SET "name" = EXCLUDED."name", "category" = EXCLUDED."category"`,
      [productId, fullName, category, brand, spec.trim() || `${fullName} - ${brand}`, hsnNo.trim() || '8541', unit.trim() || 'Pcs']
    );

    // Upsert SupplierProduct
    const validUntil = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
    const leadTime = Math.floor(1 + Math.random() * 5);
    await pool.query(
      `INSERT INTO "SupplierProduct" ("id", "supplierId", "productId", "basePrice", "gstPercentage", "effectivePrice", "totalAmount", "discount", "invoiceNo", "validUntil", "leadTime", "minimumOrderQuantity")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 1)
       ON CONFLICT ("supplierId", "productId") DO UPDATE SET "basePrice" = EXCLUDED."basePrice", "effectivePrice" = EXCLUDED."effectivePrice", "totalAmount" = EXCLUDED."totalAmount"`,
      [supplierProductId, supplierId, productId, basePrice, gstPercentage, effectivePrice, totalAmount, discount, invoiceNo, validUntil, leadTime]
    );

    importedCount++;
  }

  console.log(`🎉 SUCCESS! Created all tables and imported ${importedCount} actual solar items into NEON PostgreSQL DB!`);
}

createTablesAndImport()
  .catch((e) => console.error('❌ Error:', e))
  .finally(async () => await pool.end());
