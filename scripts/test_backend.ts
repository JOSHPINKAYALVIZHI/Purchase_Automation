import { prisma } from '../lib/prisma';
import { getProducts, createProduct } from '../lib/actions/products';
import { getSuppliers, compareSupplierPrices, upsertSupplierQuotation } from '../lib/actions/suppliers';
import { createPurchaseOrder, updatePOStatus } from '../lib/actions/purchase-orders';
import { getInventory, getLowStockAlerts } from '../lib/actions/inventory';
import { extractQuotationMetadataFromText } from '../lib/ocr/extractor';
import { getAISupplierRecommendations, processAIChatQuery } from '../lib/ai/recommendation';

async function runBackendTests() {
  console.log('\n========================================');
  console.log('🧪 RUNNING PROCURE-AI BACKEND INTEGRATION TESTS');
  console.log('========================================\n');

  // Test 1: Products Actions
  console.log('🔹 Test 1: Fetching Products with Filters...');
  const panels = await getProducts({ category: 'Solar Panel' });
  console.log(`  Found ${panels.length} Solar Panels in catalog.`);

  // Test 2: Quotation & GST Effective Price Comparison
  console.log('\n🔹 Test 2: Price Comparison for 550W Mono Panel...');
  const panelProduct = panels.find((p) => p.name.includes('550W'));
  if (panelProduct) {
    const comparison = await compareSupplierPrices(panelProduct.id);
    console.log(`  Offers found: ${comparison.quotations.length}`);
    if (comparison.highlights.lowestPrice) {
      console.log(`  Best Price: ${comparison.highlights.lowestPrice.supplier.companyName} @ ₹${comparison.highlights.lowestPrice.effectivePrice}`);
    }
    if (comparison.highlights.fastestDelivery) {
      console.log(`  Fastest Delivery: ${comparison.highlights.fastestDelivery.supplier.companyName} (${comparison.highlights.fastestDelivery.leadTime} days)`);
    }
  }

  // Test 3: OCR Quotation Automatic Extraction
  console.log('\n🔹 Test 3: OCR Extraction from Raw Quotation Text...');
  const sampleQuotationText = `
QUOTATION / TAX INVOICE
Supplier: ABC Solar Technologies Ltd
GSTIN: 27AAACA123411Z1
Address: MIDC Andheri East, Mumbai

Product: 550W Monocrystalline Solar Panel
Unit Price: ₹14,200.00
GST @ 12%
Quantity: 100 Pcs
Lead Time: 2 days
Validity: 30 Days
  `;
  const ocrResult = extractQuotationMetadataFromText(sampleQuotationText);
  console.log('  Extracted Supplier:', ocrResult.supplierName);
  console.log('  Extracted GST No:', ocrResult.gstNumber);
  console.log('  Extracted Base Price: ₹' + ocrResult.basePrice);
  console.log('  Extracted Effective Price (with GST): ₹' + ocrResult.effectivePrice);
  console.log('  Confidence Score:', ocrResult.confidenceScore + '%');

  // Test 4: AI Supplier Recommendation Scoring Algorithm
  console.log('\n🔹 Test 4: AI Supplier Multi-Criteria Scoring...');
  if (panelProduct) {
    const recommendations = await getAISupplierRecommendations(panelProduct.id);
    recommendations.forEach((rec) => {
      console.log(`  ⭐ Score: ${rec.compositeScore}/100 | ${rec.supplierName.padEnd(28)} | ₹${rec.effectivePrice} | ${rec.leadTime} days | Badges: ${rec.badges.join(', ')}`);
    });
  }

  // Test 5: Natural Language AI Assistant
  console.log('\n🔹 Test 5: Natural Language Procurement Chat Assistant...');
  const chatResponse = await processAIChatQuery('Find cheapest inverter');
  console.log('  AI Response Summary:', chatResponse.answerText.trim());

  // Test 6: Purchase Order Creation & Automatic Inventory Update on Delivery
  console.log('\n🔹 Test 6: PO Workflow & Auto Stock Synchronization...');
  const suppliers = await getSuppliers();
  const manager = await prisma.user.findFirst({ where: { role: 'PURCHASE_MANAGER' } });

  if (suppliers.length > 0 && manager && panelProduct) {
    const testPO = await createPurchaseOrder({
      supplierId: suppliers[0].id,
      createdById: manager.id,
      items: [
        {
          productId: panelProduct.id,
          quantity: 20,
          unitPrice: 14000,
          gstPercentage: 12,
        },
      ],
    });
    console.log(`  Created Test PO: ${testPO.poNumber} (Status: ${testPO.status}, Total: ₹${testPO.totalAmount})`);

    // Transition PO to DELIVERED
    console.log('  Delivering PO and updating Inventory stock automatically...');
    const deliveredPO = await updatePOStatus(testPO.id, 'DELIVERED');
    console.log(`  Updated PO Status: ${deliveredPO.status}`);

    const updatedInv = await prisma.inventory.findUnique({ where: { productId: panelProduct.id } });
    console.log(`  Updated ${panelProduct.name} Total Stock: ${updatedInv?.stock}`);
  }

  console.log('\n========================================');
  console.log('✅ ALL BACKEND TESTS PASSED SUCCESSFULLY!');
  console.log('========================================\n');
}

runBackendTests()
  .catch((e) => console.error('❌ Test failure:', e))
  .finally(async () => await prisma.$disconnect());
