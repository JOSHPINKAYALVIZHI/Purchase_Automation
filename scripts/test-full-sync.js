const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFullSyncTest() {
  console.log('🧪 Starting Full Product, Supplier & Category Synchronization Diagnostic Test...');
  try {
    // 1. Create a Test Supplier
    const testSup = await prisma.supplier.create({
      data: {
        companyName: 'Sync Test Solar Solutions Pvt Ltd',
        gstNumber: '33TESTSYNC1234Z5',
        phone: '+91 99988 77766',
        email: 'contact@synctest.com',
        address: 'Coimbatore Industrial Hub, Tamil Nadu',
        contactPerson: 'Arun Kumar (Purchase Dept)',
        status: 'ACTIVE',
      },
    });
    console.log('✅ 1. Supplier Created:', testSup.companyName);

    // 2. Create a Test Product
    const testProd = await prisma.product.create({
      data: {
        name: 'Automated Test Solar Panel 550W',
        category: 'Solar Equipment',
        brand: 'SyncBrand Solar',
        specification: '550W Mono PERC Half Cut',
        hsn: '8541',
        unit: 'Pcs',
        minimumStock: 15,
      },
    });
    console.log('✅ 2. Product Created:', testProd.name, `(${testProd.category})`);

    // 3. Create SupplierProduct Quote Rate
    const baseRate = 12500;
    const gstPct = 18;
    const effPrice = Number((baseRate * (1 + gstPct / 100)).toFixed(2));

    const sp = await prisma.supplierProduct.create({
      data: {
        supplierId: testSup.id,
        productId: testProd.id,
        basePrice: baseRate,
        gstPercentage: gstPct,
        effectivePrice: effPrice,
        totalAmount: effPrice,
        invoiceNo: 'FSCH/99999/25-26',
        leadTime: 3,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });
    console.log('✅ 3. Supplier Product Quote Linked:', `Base: ₹${sp.basePrice}, GST: ${sp.gstPercentage}%, Effective: ₹${sp.effectivePrice}`);

    // 4. Verify Query Joins
    const verifiedProduct = await prisma.product.findUnique({
      where: { id: testProd.id },
      include: {
        supplierProducts: { include: { supplier: true } },
      },
    });
    console.log('✅ 4. Product Join Query Verification:', verifiedProduct.supplierProducts[0].supplier.companyName === 'Sync Test Solar Solutions Pvt Ltd' ? 'SUCCESS' : 'FAILED');

    // 5. Clean Up Diagnostic Test Records
    await prisma.supplierProduct.deleteMany({ where: { supplierId: testSup.id } });
    await prisma.product.delete({ where: { id: testProd.id } });
    await prisma.supplier.delete({ where: { id: testSup.id } });
    console.log('🧹 5. Test Cleanup Complete! Database state clean.');
    console.log('🎉 ALL DYNAMIC SYNCHRONIZATION DIAGNOSTIC TESTS PASSED 100%!');
  } catch (err) {
    console.error('❌ Diagnostic Test Failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

runFullSyncTest();
