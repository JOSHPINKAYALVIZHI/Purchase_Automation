import { prisma } from '../lib/prisma';

async function testQuery() {
  console.log('Testing connection to Neon DB...');
  const count = await prisma.product.count();
  console.log(`✅ SUCCESS! Found ${count} products in Neon DB!`);
}

testQuery()
  .catch((e) => console.error('❌ Connection error:', e))
  .finally(() => prisma.$disconnect());
