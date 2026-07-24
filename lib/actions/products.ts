import { prisma } from '../prisma';

export interface ProductInput {
  name: string;
  category: string;
  brand: string;
  specification: string;
  hsn: string;
  unit: string;
  minimumStock?: number;
  image?: string;
}

export async function getProducts(filters?: { search?: string; category?: string; brand?: string }) {
  const whereClause: any = {};

  if (filters?.search) {
    whereClause.OR = [
      { name: { contains: filters.search } },
      { specification: { contains: filters.search } },
      { brand: { contains: filters.search } },
      { category: { contains: filters.search } },
    ];
  }

  if (filters?.category) {
    whereClause.category = filters.category;
  }

  if (filters?.brand) {
    whereClause.brand = filters.brand;
  }

  const products = await prisma.product.findMany({
    where: whereClause,
    include: {
      inventory: true,
      supplierProducts: {
        include: { supplier: true },
        orderBy: { effectivePrice: 'asc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return products;
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      inventory: true,
      supplierProducts: {
        include: { supplier: true },
        orderBy: { effectivePrice: 'asc' },
      },
      purchaseHistory: {
        include: { supplier: true },
        orderBy: { purchaseDate: 'desc' },
        take: 5,
      },
    },
  });
  return product;
}

export async function createProduct(input: ProductInput) {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      category: input.category,
      brand: input.brand,
      specification: input.specification,
      hsn: input.hsn,
      unit: input.unit,
      minimumStock: input.minimumStock ?? 10,
      image: input.image,
      inventory: {
        create: {
          warehouse: 'Main Solar Warehouse',
          stock: 0,
          reserved: 0,
          available: 0,
        },
      },
    },
    include: {
      inventory: true,
    },
  });

  return product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const product = await prisma.product.update({
    where: { id },
    data: input,
    include: { inventory: true },
  });
  return product;
}

export async function deleteProduct(id: string) {
  await prisma.product.delete({ where: { id } });
  return { success: true, message: 'Product deleted successfully' };
}
