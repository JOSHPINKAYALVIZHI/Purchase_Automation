import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('\n========================================');
  console.log('📊 PROCURE-AI DATABASE VERIFICATION REPORT');
  console.log('========================================\n');

  const usersCount = await prisma.user.count();
  const suppliersCount = await prisma.supplier.count();
  const productsCount = await prisma.product.count();
  const quotesCount = await prisma.supplierProduct.count();
  const poCount = await prisma.purchaseOrder.count();
  const inventoryCount = await prisma.inventory.count();

  console.log(`👥 Users: ${usersCount}`);
  console.log(`🏭 Suppliers: ${suppliersCount}`);
  console.log(`📦 Products: ${productsCount}`);
  console.log(`💰 Quotations/Prices: ${quotesCount}`);
  console.log(`🧾 Purchase Orders: ${poCount}`);
  console.log(`🏢 Inventory Items: ${inventoryCount}\n`);

  // Query comparison for product "550W Monocrystalline Solar Panel"
  const panelQuotes = await prisma.supplierProduct.findMany({
    where: { product: { name: { contains: '550W' } } },
    include: { supplier: true, product: true },
    orderBy: { effectivePrice: 'asc' },
  });

  console.log('--- Price Comparison for 550W Mono Solar Panel ---');
  panelQuotes.forEach((q) => {
    console.log(
      `• ${q.supplier.companyName.padEnd(30)} | Base: ₹${q.basePrice} | GST: ${q.gstPercentage}% | Final: ₹${q.effectivePrice} | Lead Time: ${q.leadTime} days | Rating: ⭐ ${q.supplier.rating}`
    );
  });

  // Low stock inventory alert check
  const lowStockItems = await prisma.inventory.findMany({
    include: { product: true },
  });
  
  console.log('\n--- Inventory & Reorder Status ---');
  lowStockItems.forEach((inv) => {
    const isLow = inv.stock < inv.product.minimumStock;
    console.log(
      `• ${inv.product.name.padEnd(35)} | Stock: ${inv.stock} | Min Stock: ${inv.product.minimumStock} | Status: ${
        isLow ? '⚠️ REORDER ALERT' : '✅ OK'
      }`
    );
  });

  console.log('\n========================================\n');
}

verify()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
