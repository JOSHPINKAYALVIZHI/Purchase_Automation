import { prisma } from '../prisma';

export interface SupplierInput {
  companyName: string;
  gstNumber: string;
  phone: string;
  email: string;
  address: string;
  rating?: number;
  status?: string;
}

export interface QuotationInput {
  supplierId: string;
  productId: string;
  basePrice: number;
  gstPercentage: number;
  leadTime: number;
  minimumOrderQuantity?: number;
  validUntil?: Date;
}

export async function getSuppliers(filters?: { search?: string; status?: string }) {
  const whereClause: any = {};

  if (filters?.search) {
    whereClause.OR = [
      { companyName: { contains: filters.search } },
      { gstNumber: { contains: filters.search } },
      { email: { contains: filters.search } },
    ];
  }

  if (filters?.status) {
    whereClause.status = filters.status;
  }

  try {
    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      include: {
        products: {
          include: { product: true },
        },
        purchaseOrders: {
          take: 5,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { companyName: 'asc' },
    });

    return suppliers || [];
  } catch (err) {
    console.error('Error in getSuppliers:', err);
    return [];
  }
}

export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        include: { product: true },
      },
      purchaseOrders: {
        include: { items: { include: { product: true } } },
        orderBy: { date: 'desc' },
      },
    },
  });
  return supplier;
}

export async function createSupplier(input: SupplierInput) {
  const supplier = await prisma.supplier.create({
    data: {
      companyName: input.companyName,
      gstNumber: input.gstNumber,
      phone: input.phone,
      email: input.email,
      address: input.address,
      rating: input.rating ?? 4.0,
      status: input.status ?? 'ACTIVE',
    },
  });

  return supplier;
}

export async function upsertSupplierQuotation(input: QuotationInput) {
  const effectivePrice = Number((input.basePrice * (1 + input.gstPercentage / 100)).toFixed(2));
  const validUntilDate = input.validUntil ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const quotation = await prisma.supplierProduct.upsert({
    where: {
      supplierId_productId: {
        supplierId: input.supplierId,
        productId: input.productId,
      },
    },
    update: {
      basePrice: input.basePrice,
      gstPercentage: input.gstPercentage,
      effectivePrice,
      leadTime: input.leadTime,
      minimumOrderQuantity: input.minimumOrderQuantity ?? 1,
      quotationDate: new Date(),
      validUntil: validUntilDate,
    },
    create: {
      supplierId: input.supplierId,
      productId: input.productId,
      basePrice: input.basePrice,
      gstPercentage: input.gstPercentage,
      effectivePrice,
      leadTime: input.leadTime,
      minimumOrderQuantity: input.minimumOrderQuantity ?? 1,
      quotationDate: new Date(),
      validUntil: validUntilDate,
    },
    include: {
      supplier: true,
      product: true,
    },
  });

  return quotation;
}

export async function compareSupplierPrices(productId: string) {
  const quotations = await prisma.supplierProduct.findMany({
    where: { productId },
    include: {
      supplier: true,
      product: true,
    },
    orderBy: { effectivePrice: 'asc' },
  });

  // Calculate cheapest, fastest, highest rated
  const lowestPrice = quotations.length > 0 ? quotations[0] : null;
  const fastestDelivery = [...quotations].sort((a, b) => a.leadTime - b.leadTime)[0] ?? null;
  const highestRated = [...quotations].sort((a, b) => b.supplier.rating - a.supplier.rating)[0] ?? null;

  return {
    productId,
    quotations,
    highlights: {
      lowestPrice,
      fastestDelivery,
      highestRated,
    },
  };
}

export async function updateSupplierContact(id: string, data: { companyName?: string; contactPerson?: string | null; phone?: string | null; email?: string | null }) {
  try {
    let existing = await prisma.supplier.findUnique({ where: { id } }).catch(() => null);
    if (!existing && data.companyName) {
      existing = await prisma.supplier.findFirst({ where: { companyName: data.companyName } }).catch(() => null);
    }

    if (existing) {
      return await prisma.supplier.update({
        where: { id: existing.id },
        data: {
          contactPerson: data.contactPerson !== undefined ? data.contactPerson : undefined,
          phone: data.phone !== undefined ? data.phone : undefined,
          email: data.email !== undefined ? data.email : undefined,
        },
      });
    } else if (data.companyName) {
      return await prisma.supplier.create({
        data: {
          companyName: data.companyName,
          gstNumber: '33AAACG123456789',
          phone: data.phone || '+91 98422 55555',
          email: data.email || 'info@supplier.com',
          address: 'Coimbatore, Tamil Nadu',
          contactPerson: data.contactPerson || null,
        },
      });
    }
  } catch (e) {
    console.error('Error updating supplier contact:', e);
  }
  return null;
}
