import { prisma } from '../prisma';

export async function getInventory(warehouse?: string) {
  const whereClause: any = {};
  if (warehouse) {
    whereClause.warehouse = warehouse;
  }

  const inventoryItems = await prisma.inventory.findMany({
    where: whereClause,
    include: {
      product: true,
    },
    orderBy: { product: { name: 'asc' } },
  });

  return inventoryItems.map((inv) => ({
    ...inv,
    isLowStock: inv.stock < inv.product.minimumStock,
  }));
}

export async function updateStock(productId: string, stockDelta: number, reservedDelta: number = 0) {
  const current = await prisma.inventory.findUnique({
    where: { productId },
  });

  const newStock = Math.max(0, (current?.stock ?? 0) + stockDelta);
  const newReserved = Math.max(0, (current?.reserved ?? 0) + reservedDelta);
  const newAvailable = Math.max(0, newStock - newReserved);

  const updated = await prisma.inventory.upsert({
    where: { productId },
    update: {
      stock: newStock,
      reserved: newReserved,
      available: newAvailable,
    },
    create: {
      productId,
      warehouse: 'Main Solar Warehouse',
      stock: Math.max(0, stockDelta),
      reserved: Math.max(0, reservedDelta),
      available: Math.max(0, stockDelta - reservedDelta),
    },
    include: { product: true },
  });

  return updated;
}

export async function getLowStockAlerts() {
  const allInventory = await prisma.inventory.findMany({
    include: { product: true },
  });

  const alerts = allInventory
    .filter((inv) => inv.stock < inv.product.minimumStock)
    .map((inv) => ({
      productId: inv.productId,
      productName: inv.product.name,
      category: inv.product.category,
      currentStock: inv.stock,
      minimumStock: inv.product.minimumStock,
      shortage: inv.product.minimumStock - inv.stock,
      warehouse: inv.warehouse,
    }));

  return alerts;
}
