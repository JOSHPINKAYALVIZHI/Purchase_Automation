export function normalizeCategory(categoryRaw: string): string {
  if (!categoryRaw || !categoryRaw.trim()) return 'Solar Equipment';

  const clean = categoryRaw.trim().toUpperCase();

  // Standardize common duplicate categories
  if (clean === 'BATTERY' || clean === 'BATTERIES') return 'Battery';
  if (clean === 'BATTERY BOX') return 'Battery Box';
  if (clean === 'CAR' || clean === 'CAR BATTERY') return 'Car Battery';
  if (clean === 'DC CABLE' || clean === 'DC CABLES') return 'DC Cable';
  if (clean === 'ACDB' || clean === 'ACDB BOX') return 'ACDB';
  if (clean === 'DCDB' || clean === 'DCDB BOX') return 'DCDB';
  if (clean === 'EARTHG' || clean === 'EARTHING' || clean === 'EARTHING ROD') return 'Earthing';
  if (
    clean === 'ELECTRICAL' ||
    clean === 'ELECTRICALS' ||
    clean === 'ELECTRICAL HARDWARE' ||
    clean === 'ELECTRICALS & HARDWARES' ||
    clean === 'ELECTRICALS & HARDWARE'
  ) {
    return 'Electrical Hardware';
  }
  if (clean === 'HARDWARE' || clean === 'HARDWARES') return 'Hardware';
  if (clean === 'AL.ARM CABLE' || clean === 'AL ARM CABLE' || clean === 'ALUMINIUM ARMOURED CABLE') {
    return 'Armoured Cable';
  }
  if (clean === 'DESIGNING') return 'Designing & Consultancy';
  if (clean === 'DIE CHARGES') return 'Die Charges';
  if (clean === 'CHEMICAL') return 'Chemical';

  // Fallback: Title Case for all other categories
  return categoryRaw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
