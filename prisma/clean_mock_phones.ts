import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realContactList = [
  {
    keys: ['FESTA SOLAR'],
    contactPerson: 'ETTAPAN (Sales Head) / DIVYA (Assistant)',
    phone: '+91 94429 65029, +91 89258 24062, +91 89259 97544',
  },
  {
    keys: ['K POWERS', 'ASWATHI'],
    contactPerson: 'warehouse',
    phone: '+91 73730 65564, +91 92444 14441',
  },
  {
    keys: ['M.G SOLAR', 'MG SOLAR'],
    contactPerson: 'Hemalatha (sales)',
    phone: '+91 90435 50368, +91 88708 59033',
  },
  {
    keys: ['R.K. METAL', 'RK METAL'],
    contactPerson: 'Sugumaran (Executive) / Ramyareena (sales)',
    phone: '+91 93449 22816, +91 89715 58181, +91 93449 16186',
  },
  {
    keys: ['ZARON'],
    contactPerson: 'Dhanaseker (Sales) / Office',
    phone: '+91 78719 66676, +91 70940 66676',
  },
  {
    keys: ['BEST INSULATION'],
    contactPerson: 'Office',
    phone: '+91 93641 23001, +91 93631 45274',
  },
  {
    keys: ['EEE ENERGY'],
    contactPerson: 'Kenila (Sales Executive) / Tamil arasan',
    phone: '+91 73977 65665, +91 84381 00739',
  },
  {
    keys: ['SV ROOFINGS'],
    contactPerson: 'Head Office',
    phone: '+91 95855 43236',
  },
  {
    keys: ['SUPREME STEELS'],
    contactPerson: 'Sunil (manager) / Office',
    phone: '+91 99762 28272, +91 74489 04000, +91 94980 77272',
  },
  {
    keys: ['OM MURUGA'],
    contactPerson: 'Kannan (sales)',
    phone: '+91 96269 80923',
  },
  {
    keys: ['EXCELERTHINGS'],
    contactPerson: 'Office / Ann Juicy Raj (Electrical Engineer)',
    phone: '+91 94005 18233, +91 92079 28885',
  },
  {
    keys: ['SOLAR HI-TECH', 'SOLAR HITECH'],
    contactPerson: 'Sivaranjini (Office Admin)',
    phone: '+91 96004 20916',
  },
  {
    keys: ['SHIVAA'],
    contactPerson: 'Pavithra (MD)',
    phone: '+91 86106 04581',
  },
  {
    keys: ['S POWER'],
    contactPerson: null,
    phone: null,
  },
];

async function main() {
  console.log('🧹 Cleaning mock phone numbers and locking real contacts...');

  const allSuppliers = await prisma.supplier.findMany();

  for (const s of allSuppliers) {
    const cleanName = s.companyName.toUpperCase();

    let foundReal = null;
    for (const item of realContactList) {
      if (item.keys.some((k) => cleanName.includes(k))) {
        foundReal = item;
        break;
      }
    }

    if (foundReal && foundReal.phone) {
      await prisma.supplier.update({
        where: { id: s.id },
        data: {
          contactPerson: foundReal.contactPerson,
          phone: foundReal.phone,
        },
      });
      console.log(`✅ Kept Real Contact for: ${s.companyName}`);
    } else {
      await prisma.supplier.update({
        where: { id: s.id },
        data: {
          contactPerson: null,
          phone: null,
        },
      });
      console.log(`🧼 Cleared Mock Phone for: ${s.companyName}`);
    }
  }

  console.log('🎉 Mock phone cleanup complete!');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
