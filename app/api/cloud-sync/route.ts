import { NextRequest, NextResponse } from 'next/server';

const CLOUD_OBJECT_URL = 'https://api.restful-api.dev/objects/ff8081819ff5b11001a006aa38692663';

export async function GET() {
  try {
    const res = await fetch(CLOUD_OBJECT_URL, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ success: true, logs: [], products: [], suppliers: [] }, { status: 200 });
    }
    const json = await res.json();
    const data = json.data || {};
    return NextResponse.json({
      success: true,
      logs: data.logs || [],
      products: data.products || [],
      suppliers: data.suppliers || [],
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching cloud sync data:', error);
    return NextResponse.json({ success: true, logs: [], products: [], suppliers: [] }, { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { newLogs, newProducts, newSuppliers } = body;

    // 1. Fetch current cloud state
    let currentLogs: any[] = [];
    let currentProducts: any[] = [];
    let currentSuppliers: any[] = [];

    try {
      const getRes = await fetch(CLOUD_OBJECT_URL, { cache: 'no-store' });
      if (getRes.ok) {
        const getJson = await getRes.json();
        if (getJson.data) {
          currentLogs = getJson.data.logs || [];
          currentProducts = getJson.data.products || [];
          currentSuppliers = getJson.data.suppliers || [];
        }
      }
    } catch (e) {}

    // 2. Merge new entries avoiding duplicates by unique ID / key
    const logsMap = new Map<string, any>();
    currentLogs.forEach((l, idx) => {
      const logId = l.id || `log_${l.date || 'nodate'}_${(l.productName || 'item').toLowerCase().replace(/\s+/g, '_')}_${idx}`;
      logsMap.set(logId, { ...l, id: logId });
    });
    if (Array.isArray(newLogs)) {
      newLogs.forEach((l, idx) => {
        const logId = l.id || `log_${l.date || 'nodate'}_${(l.productName || 'item').toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${idx}`;
        logsMap.set(logId, { ...l, id: logId });
      });
    }

    const prodsMap = new Map<string, any>();
    currentProducts.forEach((p) => {
      const pKey = p.id || (p.name ? p.name.toLowerCase().trim() : `prod_${Math.random()}`);
      prodsMap.set(pKey, { ...p, id: pKey });
    });
    if (Array.isArray(newProducts)) {
      newProducts.forEach((p) => {
        const pKey = p.id || (p.name ? p.name.toLowerCase().trim() : `prod_${Math.random()}`);
        prodsMap.set(pKey, { ...p, id: pKey });
      });
    }

    const supsMap = new Map<string, any>();
    currentSuppliers.forEach((s) => {
      const sKey = s.id || (s.companyName ? s.companyName.toLowerCase().trim() : `sup_${Math.random()}`);
      supsMap.set(sKey, { ...s, id: sKey });
    });
    if (Array.isArray(newSuppliers)) {
      newSuppliers.forEach((s) => {
        const sKey = s.id || (s.companyName ? s.companyName.toLowerCase().trim() : `sup_${Math.random()}`);
        supsMap.set(sKey, { ...s, id: sKey });
      });
    }

    const updatedData = {
      logs: Array.from(logsMap.values()),
      products: Array.from(prodsMap.values()),
      suppliers: Array.from(supsMap.values()),
    };

    // 3. Save updated state back to shared cloud object
    await fetch(CLOUD_OBJECT_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Jesuans ERP Sync Store',
        data: updatedData,
      }),
    });

    return NextResponse.json({ success: true, data: updatedData }, { status: 200 });
  } catch (error: any) {
    console.error('Error saving cloud sync data:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 200 });
  }
}
