const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearData() {
  console.log('Cleaning database for live production startup...');
  try {
    await prisma.purchaseOrderItem.deleteMany({});
    await prisma.purchaseOrder.deleteMany({});
    await prisma.supplierProduct.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.supplier.deleteMany({});
    console.log('✅ Database tables cleared successfully! (Users retained)');
  } catch (err) {
    console.error('❌ Error clearing database:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();
