const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearAll() {
  console.log('Clearing all database records...');

  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  await prisma.supplierProduct.deleteMany({});
  await prisma.inventory.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Successfully wiped all database tables clean!');
  await prisma.$disconnect();
}

clearAll().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
