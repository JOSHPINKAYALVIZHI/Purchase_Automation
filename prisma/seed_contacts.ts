import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const realContacts = [
  {
    companyName: 'FESTA SOLAR PVT LTD',
    contactPerson: 'ETTAPAN (Sales Head) / DIVYA (Assistant)',
    phone: '+91 94429 65029, +91 89258 24062, +91 89259 97544',
  },
  {
    companyName: 'K POWERS',
    contactPerson: 'warehouse',
    phone: '+91 73730 65564, +91 92444 14441',
  },
  {
    companyName: 'M.G SOLAR',
    contactPerson: 'Hemalatha (sales)',
    phone: '+91 90435 50368, +91 88708 59033',
  },
  {
    companyName: 'R.K. METAL ROOFINGS PVT LTD',
    contactPerson: 'Sugumaran (Executive) / Ramyareena (sales)',
    phone: '+91 93449 22816, +91 89715 58181, +91 93449 16186',
  },
  {
    companyName: 'ZARON',
    contactPerson: 'Dhanaseker (Sales) / Office',
    phone: '+91 78719 66676, +91 70940 66676',
  },
  {
    companyName: 'BEST INSULATION',
    contactPerson: 'Office',
    phone: '+91 93641 23001, +91 93631 45274',
  },
  {
    companyName: 'EEE ENERGY SOLUTIONS',
    contactPerson: 'Kenila (Sales Executive) / Tamil arasan',
    phone: '+91 73977 65665, +91 84381 00739',
  },
  {
    companyName: 'SV ROOFINGS',
    contactPerson: 'Head Office',
    phone: '+91 95855 43236',
  },
  {
    companyName: 'SUPREME STEELS',
    contactPerson: 'Sunil (manager) / Office',
    phone: '+91 99762 28272, +91 74489 04000, +91 94980 77272',
  },
  {
    companyName: 'OM MURUGA STEELS',
    contactPerson: 'Kannan (sales)',
    phone: '+91 96269 80923',
  },
  {
    companyName: 'EXCELERTHINGS',
    contactPerson: 'Ann Juicy Raj (Electrical Engineer) / Office',
    phone: '+91 92079 28885, +91 94005 18233',
  },
  {
    companyName: 'SOLAR HI-TECH',
    contactPerson: 'Sivaranjini (Office Admin)',
    phone: '+91 96004 20916',
  },
  {
    companyName: 'SHIVAA ENGINEERING WORKS',
    contactPerson: 'Pavithra (MD)',
    phone: '+91 86106 04581',
  },
  {
    companyName: 'S POWER NEW ENERGY INDIA PVT LTD',
    contactPerson: null,
    phone: '+91 98422 10099',
  },
];

async function main() {
  console.log('🔄 Seeding exact real supplier contact details into database...');

  const allSuppliers = await prisma.supplier.findMany();

  for (const item of realContacts) {
    const matched = allSuppliers.find(
      (s) =>
        s.companyName.toLowerCase().trim() === item.companyName.toLowerCase().trim() ||
        s.companyName.toLowerCase().includes(item.companyName.toLowerCase().split(' ')[0])
    );

    if (matched) {
      await prisma.supplier.update({
        where: { id: matched.id },
        data: {
          contactPerson: item.contactPerson,
          phone: item.phone,
        },
      });
      console.log(`✅ Updated ${matched.companyName} -> Contact: ${item.contactPerson}, Phone: ${item.phone}`);
    }
  }

  console.log('🎉 Supplier contacts updated successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
