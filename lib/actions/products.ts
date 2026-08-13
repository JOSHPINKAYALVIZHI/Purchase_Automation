import { prisma } from '../prisma';
import { normalizeCategory } from '../normalizeCategory';

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

export async function addFullProductQuote(input: any) {
  const normCategory = normalizeCategory(input.category || 'Solar Equipment');
  const productName = input.name.trim();
  const brand = (input.brand || 'Standard Solar').trim();
  const spec = (input.specification || `${productName} - ${brand}`).trim();
  const hsn = (input.hsn || '8541').trim();
  const unit = (input.unit || 'Pcs').trim();

  let targetSupplierId = input.supplierId;

  function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  // 1. If "Other" / New Supplier is created
  if (input.isNewSupplier || targetSupplierId === 'OTHER') {
    const cleanVendorName = (input.newCompanyName || 'New Solar Vendor').trim();
    const cleanGst = input.newGstNumber?.trim() || `33AAACG${Math.abs(hashString(cleanVendorName)).toString().padStart(6, '0')}1Z5`;
    const address = (input.newAddress || 'Coimbatore, Tamil Nadu').trim();
    let phone = (input.newPhone || '+91 98422 55555').trim();
    if (input.newContactPerson?.trim()) {
      phone = `${phone} (${input.newContactPerson.trim()})`;
    }

    const supplier = await prisma.supplier.upsert({
      where: { gstNumber: cleanGst },
      update: {
        companyName: cleanVendorName,
        address,
        phone,
        contactPerson: input.newContactPerson?.trim() || null,
      },
      create: {
        companyName: cleanVendorName,
        gstNumber: cleanGst,
        phone,
        email: input.newEmail?.trim() || null,
        address,
        contactPerson: input.newContactPerson?.trim() || null,
        rating: 4.5,
        status: 'ACTIVE',
      },
    });

    targetSupplierId = supplier.id;
  }

  // 2. Create or Update Product
  const productId = `prod_${hashString(productName)}`;
  const product = await prisma.product.upsert({
    where: { id: productId },
    update: {
      name: productName,
      category: normCategory,
      brand,
      specification: spec,
      hsn,
      unit,
    },
    create: {
      id: productId,
      name: productName,
      category: normCategory,
      brand,
      specification: spec,
      hsn,
      unit,
      minimumStock: 20,
    },
  });

  // Ensure Inventory exists
  await prisma.inventory.upsert({
    where: { productId: product.id },
    update: {},
    create: {
      productId: product.id,
      warehouse: 'Main Solar Warehouse',
      stock: 25,
      reserved: 2,
      available: 23,
    },
  });

  // 3. Upsert SupplierProduct Quotation Rate
  const basePrice = parseFloat(input.basePrice) || 0;
  const gstPercentage = parseFloat(input.gstPercentage) || 18;
  const effectivePrice = Number((basePrice * (1 + gstPercentage / 100)).toFixed(2));
  const totalAmount = parseFloat(input.totalAmount) || effectivePrice;

  let quoteDate = new Date();
  if (input.date) {
    const parsed = new Date(input.date);
    if (!isNaN(parsed.getTime())) {
      quoteDate = parsed;
    }
  }

  const supplierProduct = await prisma.supplierProduct.upsert({
    where: {
      supplierId_productId: {
        supplierId: targetSupplierId,
        productId: product.id,
      },
    },
    update: {
      basePrice,
      gstPercentage,
      effectivePrice,
      totalAmount,
      discount: input.discount?.trim() || null,
      invoiceNo: input.invoiceNo?.trim() || null,
      quotationDate: quoteDate,
      updatedAt: quoteDate,
      validUntil: new Date(quoteDate.getTime() + 60 * 24 * 60 * 60 * 1000),
    },
    create: {
      supplierId: targetSupplierId,
      productId: product.id,
      basePrice,
      gstPercentage,
      effectivePrice,
      totalAmount,
      discount: input.discount?.trim() || null,
      invoiceNo: input.invoiceNo?.trim() || null,
      quotationDate: quoteDate,
      createdAt: quoteDate,
      updatedAt: quoteDate,
      validUntil: new Date(quoteDate.getTime() + 60 * 24 * 60 * 60 * 1000),
      leadTime: 3,
      minimumOrderQuantity: 1,
    },
  });

  return { product, supplierProduct };
}
