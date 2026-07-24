import { prisma } from '../prisma';

export interface CreatePOItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
  gstPercentage: number;
}

export interface CreatePOInput {
  supplierId: string;
  createdById: string;
  items: CreatePOItemInput[];
}

export async function getPurchaseOrders(filters?: { status?: string; supplierId?: string }) {
  const whereClause: any = {};

  if (filters?.status) {
    whereClause.status = filters.status;
  }
  if (filters?.supplierId) {
    whereClause.supplierId = filters.supplierId;
  }

  const orders = await prisma.purchaseOrder.findMany({
    where: whereClause,
    include: {
      supplier: true,
      createdBy: true,
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return orders;
}

export async function getPOById(id: string) {
  const order = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      createdBy: true,
      items: {
        include: { product: true },
      },
    },
  });
  return order;
}

export async function createPurchaseOrder(input: CreatePOInput) {
  // Generate PO Number PO-YYYY-XXXXX
  const count = await prisma.purchaseOrder.count();
  const year = new Date().getFullYear();
  const poNumber = `PO-${year}-${String(count + 1).padStart(5, '0')}`;

  let grandTotal = 0;
  const itemsData = input.items.map((item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    const itemTotal = Number((itemSubtotal * (1 + item.gstPercentage / 100)).toFixed(2));
    grandTotal += itemTotal;

    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      gstPercentage: item.gstPercentage,
      total: itemTotal,
    };
  });

  const order = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: input.supplierId,
      createdById: input.createdById,
      status: 'PENDING',
      totalAmount: grandTotal,
      items: {
        create: itemsData,
      },
    },
    include: {
      supplier: true,
      createdBy: true,
      items: { include: { product: true } },
    },
  });

  return order;
}

export async function updatePOStatus(poId: string, newStatus: string) {
  const existing = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true },
  });

  if (!existing) {
    throw new Error(`Purchase order ${poId} not found`);
  }

  const updatedOrder = await prisma.purchaseOrder.update({
    where: { id: poId },
    data: { status: newStatus },
    include: {
      supplier: true,
      items: { include: { product: true } },
    },
  });

  // If status transitions to DELIVERED, automatically update Inventory and log PurchaseHistory!
  if (newStatus === 'DELIVERED' && existing.status !== 'DELIVERED') {
    for (const item of updatedOrder.items) {
      // 1. Update Inventory
      await prisma.inventory.upsert({
        where: { productId: item.productId },
        update: {
          stock: { increment: item.quantity },
          available: { increment: item.quantity },
        },
        create: {
          productId: item.productId,
          warehouse: 'Main Solar Warehouse',
          stock: item.quantity,
          reserved: 0,
          available: item.quantity,
        },
      });

      // 2. Add to Purchase History
      await prisma.purchaseHistory.create({
        data: {
          productId: item.productId,
          supplierId: updatedOrder.supplierId,
          quantity: item.quantity,
          actualPrice: item.unitPrice,
          purchaseDate: new Date(),
          invoiceNo: `INV-${updatedOrder.poNumber}`,
        },
      });
    }
  }

  return updatedOrder;
}
