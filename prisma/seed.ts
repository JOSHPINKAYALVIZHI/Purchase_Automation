import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for ProcureAI...');

  // Clean existing data
  await prisma.purchaseHistory.deleteMany();
  await prisma.purchaseOrderItem.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplierProduct.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.product.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.user.deleteMany();

  console.log('🧹 Cleaned existing database records.');

  // 1. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@procureai.com',
      role: 'ADMIN',
      department: 'Management',
    },
  });

  const purchaseManager = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'rajesh@procureai.com',
      role: 'PURCHASE_MANAGER',
      department: 'Procurement',
    },
  });

  const warehouseStaff = await prisma.user.create({
    data: {
      name: 'Suresh Kumar',
      email: 'suresh@procureai.com',
      role: 'WAREHOUSE',
      department: 'Logistics & Store',
    },
  });

  const financeOfficer = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'priya@procureai.com',
      role: 'FINANCE',
      department: 'Finance & Accounts',
    },
  });

  const supplierUser = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      email: 'supplier@abcsolar.com',
      role: 'SUPPLIER',
      department: 'Vendor Sales',
    },
  });

  console.log('✅ Created System Users.');

  // 2. Create Suppliers
  const supplierABC = await prisma.supplier.create({
    data: {
      companyName: 'ABC Solar Technologies Ltd',
      gstNumber: '27AAACA123411Z1',
      phone: '+91 98765 43210',
      email: 'sales@abcsolar.com',
      address: 'Plot 42, MIDC Industrial Area, Andheri East, Mumbai, MH',
      rating: 4.8,
      status: 'ACTIVE',
    },
  });

  const supplierSunPower = await prisma.supplier.create({
    data: {
      companyName: 'SunPower Components Pvt Ltd',
      gstNumber: '07AABCS567822Z2',
      phone: '+91 98123 45678',
      email: 'orders@sunpowercomp.com',
      address: '12 Okhla Industrial Estate Phase III, New Delhi, DL',
      rating: 4.5,
      status: 'ACTIVE',
    },
  });

  const supplierRays = await prisma.supplier.create({
    data: {
      companyName: 'Rays Energy Solutions',
      gstNumber: '33AABCR998833Z3',
      phone: '+91 94440 11223',
      email: 'info@raysenergy.in',
      address: '88 Guindy Industrial Estate, Chennai, TN',
      rating: 4.2,
      status: 'ACTIVE',
    },
  });

  const supplierVertex = await prisma.supplier.create({
    data: {
      companyName: 'Vertex Photovoltaic Ltd',
      gstNumber: '24AABCV445544Z4',
      phone: '+91 97230 66778',
      email: 'contact@vertexpv.com',
      address: 'GIDC Solar Park, Changodar, Ahmedabad, GJ',
      rating: 4.6,
      status: 'ACTIVE',
    },
  });

  const supplierApex = await prisma.supplier.create({
    data: {
      companyName: 'Apex Solar Accessories',
      gstNumber: '36AABCA112255Z5',
      phone: '+91 91000 88990',
      email: 'support@apexsolar.co.in',
      address: 'Secunderabad Electronics Complex, Hyderabad, TS',
      rating: 4.0,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created Suppliers.');

  // 3. Create Products
  const prodPanel550W = await prisma.product.create({
    data: {
      name: '550W Monocrystalline Solar Panel',
      category: 'Solar Panel',
      brand: 'Vikram Solar',
      specification: '550W Mono PERC, 144 Half-Cut Cells, 21.3% Efficiency',
      hsn: '85414011',
      unit: 'Pcs',
      minimumStock: 50,
      image: '/images/products/550w-mono.png',
    },
  });

  const prodPanel540W = await prisma.product.create({
    data: {
      name: '540W Monocrystalline Solar Panel',
      category: 'Solar Panel',
      brand: 'Waaree Energies',
      specification: '540W Mono PERC, 144 Cells, Silver Frame',
      hsn: '85414011',
      unit: 'Pcs',
      minimumStock: 40,
      image: '/images/products/540w-mono.png',
    },
  });

  const prodPanel580W = await prisma.product.create({
    data: {
      name: '580W Bifacial Half-Cut Panel',
      category: 'Solar Panel',
      brand: 'Adani Solar',
      specification: '580W Dual Glass Bifacial N-Type TOPCon',
      hsn: '85414011',
      unit: 'Pcs',
      minimumStock: 30,
      image: '/images/products/580w-bifacial.png',
    },
  });

  const prodMC4 = await prisma.product.create({
    data: {
      name: 'MC4 Solar Connector Pair',
      category: 'Connectors',
      brand: 'Stäubli',
      specification: '1000V DC / 1500V DC, IP68 Waterproof Male/Female Pair',
      hsn: '85366990',
      unit: 'Pair',
      minimumStock: 500,
      image: '/images/products/mc4-connector.png',
    },
  });

  const prodDCCable = await prisma.product.create({
    data: {
      name: '4 sq mm Solar DC Cable (100m Roll)',
      category: 'Cables',
      brand: 'Polycab',
      specification: 'Twin Core Cross-Linked Polyolefin, UV Resistant, 1.8kV DC',
      hsn: '85444999',
      unit: 'Roll',
      minimumStock: 20,
      image: '/images/products/dc-cable.png',
    },
  });

  const prodInverter10kW = await prisma.product.create({
    data: {
      name: '10kW 3-Phase Solar Grid Inverter',
      category: 'Inverter',
      brand: 'Sungrow',
      specification: '10kW Dual MPPT, 98.6% Efficiency, Wi-Fi Monitoring',
      hsn: '85044090',
      unit: 'Pcs',
      minimumStock: 5,
      image: '/images/products/inverter-10kw.png',
    },
  });

  const prodDCFuse = await prisma.product.create({
    data: {
      name: '15A 1000V DC Solar Fuse',
      category: 'Fuses & Protection',
      brand: 'Eaton Bussmann',
      specification: '10x38mm gPV Solar Fuse Link 15 Amp 1000V DC',
      hsn: '85361000',
      unit: 'Pcs',
      minimumStock: 100,
      image: '/images/products/dc-fuse.png',
    },
  });

  console.log('✅ Created Products.');

  // 4. Create Supplier Products (Quotations / Pricing)
  const now = new Date();
  const validDays30 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Helper for effective price calc
  const calcEffective = (base: number, gstPct: number) => Number((base * (1 + gstPct / 100)).toFixed(2));

  await prisma.supplierProduct.createMany({
    data: [
      // 550W Mono Panel quotes
      {
        supplierId: supplierABC.id,
        productId: prodPanel550W.id,
        basePrice: 14000,
        gstPercentage: 12,
        effectivePrice: calcEffective(14000, 12), // 15,680
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 3,
        minimumOrderQuantity: 10,
      },
      {
        supplierId: supplierSunPower.id,
        productId: prodPanel550W.id,
        basePrice: 14500,
        gstPercentage: 12,
        effectivePrice: calcEffective(14500, 12), // 16,240
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 2,
        minimumOrderQuantity: 5,
      },
      {
        supplierId: supplierVertex.id,
        productId: prodPanel550W.id,
        basePrice: 13800,
        gstPercentage: 12,
        effectivePrice: calcEffective(13800, 12), // 15,456
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 7,
        minimumOrderQuantity: 50,
      },

      // MC4 Connector Pair quotes
      {
        supplierId: supplierABC.id,
        productId: prodMC4.id,
        basePrice: 18.0,
        gstPercentage: 18,
        effectivePrice: calcEffective(18.0, 18), // 21.24
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 2,
        minimumOrderQuantity: 100,
      },
      {
        supplierId: supplierApex.id,
        productId: prodMC4.id,
        basePrice: 19.0,
        gstPercentage: 5,
        effectivePrice: calcEffective(19.0, 5), // 19.95
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 1,
        minimumOrderQuantity: 500,
      },
      {
        supplierId: supplierRays.id,
        productId: prodMC4.id,
        basePrice: 20.0,
        gstPercentage: 18,
        effectivePrice: calcEffective(20.0, 18), // 23.60
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 3,
        minimumOrderQuantity: 50,
      },

      // Inverter 10kW quotes
      {
        supplierId: supplierSunPower.id,
        productId: prodInverter10kW.id,
        basePrice: 52000,
        gstPercentage: 18,
        effectivePrice: calcEffective(52000, 18), // 61,360
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 4,
        minimumOrderQuantity: 1,
      },
      {
        supplierId: supplierRays.id,
        productId: prodInverter10kW.id,
        basePrice: 50000,
        gstPercentage: 18,
        effectivePrice: calcEffective(50000, 18), // 59,000
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 5,
        minimumOrderQuantity: 1,
      },

      // 4 sq mm DC Cable quotes
      {
        supplierId: supplierApex.id,
        productId: prodDCCable.id,
        basePrice: 3200,
        gstPercentage: 18,
        effectivePrice: calcEffective(3200, 18), // 3,776
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 2,
        minimumOrderQuantity: 5,
      },
      {
        supplierId: supplierSunPower.id,
        productId: prodDCCable.id,
        basePrice: 3400,
        gstPercentage: 18,
        effectivePrice: calcEffective(3400, 18), // 4,012
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 1,
        minimumOrderQuantity: 2,
      },

      // 15A DC Fuse quotes
      {
        supplierId: supplierApex.id,
        productId: prodDCFuse.id,
        basePrice: 65,
        gstPercentage: 18,
        effectivePrice: calcEffective(65, 18), // 76.70
        quotationDate: now,
        validUntil: validDays30,
        leadTime: 2,
        minimumOrderQuantity: 50,
      },
    ],
  });

  console.log('✅ Created Supplier Quotations & Pricing.');

  // 5. Create Inventory
  await prisma.inventory.createMany({
    data: [
      {
        productId: prodPanel550W.id,
        warehouse: 'Main Solar Warehouse',
        stock: 60,
        reserved: 10,
        available: 50,
      },
      {
        productId: prodPanel540W.id,
        warehouse: 'Main Solar Warehouse',
        stock: 35, // Low stock alert (min 40)
        reserved: 5,
        available: 30,
      },
      {
        productId: prodPanel580W.id,
        warehouse: 'Main Solar Warehouse',
        stock: 45,
        reserved: 5,
        available: 40,
      },
      {
        productId: prodMC4.id,
        warehouse: 'Electronics Store B',
        stock: 1200,
        reserved: 200,
        available: 1000,
      },
      {
        productId: prodDCCable.id,
        warehouse: 'Main Solar Warehouse',
        stock: 15, // Low stock alert (min 20)
        reserved: 3,
        available: 12,
      },
      {
        productId: prodInverter10kW.id,
        warehouse: 'Main Solar Warehouse',
        stock: 8,
        reserved: 2,
        available: 6,
      },
      {
        productId: prodDCFuse.id,
        warehouse: 'Electronics Store B',
        stock: 250,
        reserved: 30,
        available: 220,
      },
    ],
  });

  console.log('✅ Created Inventory Records.');

  // 6. Create Purchase Orders
  const po1 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-00125',
      supplierId: supplierABC.id,
      createdById: purchaseManager.id,
      status: 'APPROVED',
      totalAmount: 156800,
      items: {
        create: [
          {
            productId: prodPanel550W.id,
            quantity: 10,
            unitPrice: 14000,
            gstPercentage: 12,
            total: 156800,
          },
        ],
      },
    },
  });

  const po2 = await prisma.purchaseOrder.create({
    data: {
      poNumber: 'PO-2026-00126',
      supplierId: supplierApex.id,
      createdById: purchaseManager.id,
      status: 'PENDING',
      totalAmount: 19950,
      items: {
        create: [
          {
            productId: prodMC4.id,
            quantity: 1000,
            unitPrice: 19.0,
            gstPercentage: 5,
            total: 19950,
          },
        ],
      },
    },
  });

  console.log('✅ Created Purchase Orders.');

  // 7. Create Purchase History
  await prisma.purchaseHistory.createMany({
    data: [
      {
        productId: prodPanel550W.id,
        supplierId: supplierABC.id,
        quantity: 50,
        purchaseDate: new Date('2026-06-15'),
        invoiceNo: 'INV-ABC-991',
        actualPrice: 13900,
      },
      {
        productId: prodMC4.id,
        supplierId: supplierApex.id,
        quantity: 2000,
        purchaseDate: new Date('2026-06-20'),
        invoiceNo: 'INV-APX-402',
        actualPrice: 18.5,
      },
      {
        productId: prodInverter10kW.id,
        supplierId: supplierRays.id,
        quantity: 4,
        purchaseDate: new Date('2026-07-01'),
        invoiceNo: 'INV-RAYS-778',
        actualPrice: 49500,
      },
    ],
  });

  console.log('✅ Created Purchase History.');
  console.log('🎉 Seed process completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
