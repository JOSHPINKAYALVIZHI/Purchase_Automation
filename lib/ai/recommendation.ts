import { prisma } from '../prisma';

export interface RecommendationCriteria {
  priceWeight?: number; // default 0.40
  leadTimeWeight?: number; // default 0.25
  ratingWeight?: number; // default 0.20
  moqWeight?: number; // default 0.15
}

export interface SupplierRecommendationScore {
  supplierId: string;
  supplierName: string;
  rating: number;
  productId: string;
  productName: string;
  basePrice: number;
  gstPercentage: number;
  effectivePrice: number;
  leadTime: number;
  minimumOrderQuantity: number;
  compositeScore: number; // 0 to 100
  scoreBreakdown: {
    priceScore: number;
    leadTimeScore: number;
    ratingScore: number;
    moqScore: number;
  };
  badges: string[];
}

export async function getAISupplierRecommendations(
  productId: string,
  criteria?: RecommendationCriteria
): Promise<SupplierRecommendationScore[]> {
  const wPrice = criteria?.priceWeight ?? 0.4;
  const wLeadTime = criteria?.leadTimeWeight ?? 0.25;
  const wRating = criteria?.ratingWeight ?? 0.2;
  const wMoq = criteria?.moqWeight ?? 0.15;

  const quotes = await prisma.supplierProduct.findMany({
    where: { productId },
    include: { supplier: true, product: true },
  });

  if (quotes.length === 0) return [];

  // Determine min and max for normalization
  const prices = quotes.map((q) => q.effectivePrice);
  const leadTimes = quotes.map((q) => q.leadTime);
  const moqs = quotes.map((q) => q.minimumOrderQuantity);

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  const minLeadTime = Math.min(...leadTimes);
  const maxLeadTime = Math.max(...leadTimes);

  const minMoq = Math.min(...moqs);
  const maxMoq = Math.max(...moqs);

  const results: SupplierRecommendationScore[] = quotes.map((q) => {
    // Price score (lower is better): scale 0 to 100
    const priceScore = maxPrice === minPrice ? 100 : ((maxPrice - q.effectivePrice) / (maxPrice - minPrice)) * 100;

    // Lead time score (shorter is better)
    const leadTimeScore = maxLeadTime === minLeadTime ? 100 : ((maxLeadTime - q.leadTime) / (maxLeadTime - minLeadTime)) * 100;

    // Rating score (1 to 5 scale -> 0 to 100)
    const ratingScore = (q.supplier.rating / 5) * 100;

    // MOQ score (lower is better)
    const moqScore = maxMoq === minMoq ? 100 : ((maxMoq - q.minimumOrderQuantity) / (maxMoq - minMoq)) * 100;

    // Composite score
    const compositeScore = Number((priceScore * wPrice + leadTimeScore * wLeadTime + ratingScore * wRating + moqScore * wMoq).toFixed(1));

    // Determine badges
    const badges: string[] = [];
    if (q.effectivePrice === minPrice) badges.push('Best Price');
    if (q.leadTime === minLeadTime) badges.push('Fastest Delivery');
    if (q.supplier.rating >= 4.5) badges.push('Highest Rated');
    if (compositeScore >= 80) badges.push('AI Recommended');

    return {
      supplierId: q.supplierId,
      supplierName: q.supplier.companyName,
      rating: q.supplier.rating,
      productId: q.productId,
      productName: q.product.name,
      basePrice: q.basePrice,
      gstPercentage: q.gstPercentage,
      effectivePrice: q.effectivePrice,
      leadTime: q.leadTime,
      minimumOrderQuantity: q.minimumOrderQuantity,
      compositeScore,
      scoreBreakdown: {
        priceScore: Math.round(priceScore),
        leadTimeScore: Math.round(leadTimeScore),
        ratingScore: Math.round(ratingScore),
        moqScore: Math.round(moqScore),
      },
      badges,
    };
  });

  // Sort by composite score descending
  return results.sort((a, b) => b.compositeScore - a.compositeScore);
}

export async function processAIChatQuery(query: string) {
  const normalized = query.toLowerCase();

  // 1. Identify product category / query intent
  let matchedProducts = await prisma.product.findMany({
    include: {
      supplierProducts: {
        include: { supplier: true },
        orderBy: { effectivePrice: 'asc' },
      },
    },
  });

  if (normalized.includes('550w') || normalized.includes('550')) {
    matchedProducts = matchedProducts.filter((p) => p.name.includes('550W'));
  } else if (normalized.includes('inverter')) {
    matchedProducts = matchedProducts.filter((p) => p.category === 'Inverter');
  } else if (normalized.includes('connector') || normalized.includes('mc4')) {
    matchedProducts = matchedProducts.filter((p) => p.name.includes('MC4'));
  } else if (normalized.includes('cable')) {
    matchedProducts = matchedProducts.filter((p) => p.category === 'Cables');
  }

  // 2. Build structured recommendations response
  const summary: any[] = [];
  for (const prod of matchedProducts) {
    const recs = await getAISupplierRecommendations(prod.id);
    summary.push({
      productId: prod.id,
      productName: prod.name,
      topRecommendation: recs.length > 0 ? recs[0] : null,
      allOffers: recs,
    });
  }

  // 3. Format conversational response
  let answerText = `Found ${summary.length} product(s) matching your request.\n`;
  summary.forEach((item) => {
    if (item.topRecommendation) {
      const top = item.topRecommendation;
      answerText += `\n📦 **${item.productName}**:\n`;
      answerText += `• Top Choice: **${top.supplierName}**\n`;
      answerText += `• Effective Price: ₹${top.effectivePrice} (Base: ₹${top.basePrice} + ${top.gstPercentage}% GST)\n`;
      answerText += `• Lead Time: ${top.leadTime} days | Supplier Rating: ⭐ ${top.rating}\n`;
      answerText += `• Badges: ${top.badges.join(', ')}\n`;
    }
  });

  return {
    query,
    answerText,
    data: summary,
  };
}
