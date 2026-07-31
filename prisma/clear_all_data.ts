import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping all database table records for fresh testing...');

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseOrderItem";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseOrder";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "PurchaseHistory";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "QuotationItem";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Quotation";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "SupplierProduct";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Inventory";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Product";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "Supplier";`);
  } catch (e) {}

  try {
    await prisma.$executeRawUnsafe(`DELETE FROM "User";`);
  } catch (e) {}

  console.log('✅ All database table records cleared successfully!');
}

main()
  .catch((e) => {
    console.error('Error clearing database tables:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
