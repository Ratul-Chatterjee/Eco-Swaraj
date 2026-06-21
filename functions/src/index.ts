import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import type { CarbonAnalyticsDocument, CarbonAnalyticsResponse } from "./carbonAnalyticsContract";

admin.initializeApp();

const db = admin.firestore();
const DOC_PATH = "publicAnalytics/indiaCarbon";

const FALLBACK_SOURCE = {
  provider: "Eco-Swaraj dataset pipeline",
  dataset: "India carbon analytics dataset (2014)",
  generatedAt: new Date().toISOString(),
  freshness: "static snapshot"
};

const INDIA_STATE_ANALYTICS: Array<{ state: string; value: number }> = [
  { state: "Maharashtra", value: 2.0 },
  { state: "Delhi (NCT)", value: 2.8 },
  { state: "Karnataka", value: 1.5 },
  { state: "Gujarat", value: 2.5 },
  { state: "Tamil Nadu", value: 1.7 },
  { state: "West Bengal", value: 1.8 },
  { state: "Telangana", value: 1.6 },
  { state: "Uttar Pradesh", value: 1.2 },
  { state: "Kerala", value: 1.0 },
  { state: "Odisha", value: 2.2 },
  { state: "Rajasthan", value: 1.4 },
  { state: "Haryana", value: 1.9 },
  { state: "Punjab", value: 1.8 },
  { state: "Madhya Pradesh", value: 1.5 },
  { state: "Bihar", value: 0.6 },
  { state: "Assam", value: 0.8 },
  { state: "Andhra Pradesh", value: 1.7 },
  { state: "Chhattisgarh", value: 1.8 },
  { state: "Jharkhand", value: 1.8 },
  { state: "Jammu & Kashmir", value: 1.8 },
  { state: "Ladakh", value: 1.8 },
  { state: "Himachal Pradesh", value: 1.8 },
  { state: "Uttarakhand", value: 1.8 },
  { state: "Goa", value: 1.8 },
  { state: "Sikkim", value: 1.8 },
  { state: "Manipur", value: 1.8 },
  { state: "Mizoram", value: 1.8 },
  { state: "Nagaland", value: 1.8 },
  { state: "Tripura", value: 1.8 },
  { state: "Meghalaya", value: 1.8 },
  { state: "Arunachal Pradesh", value: 0.7 },
  { state: "Puducherry", value: 1.8 },
  { state: "Chandigarh", value: 1.8 },
  { state: "Lakshadweep", value: 1.8 },
  { state: "Andaman and Nicobar Islands", value: 1.8 },
  { state: "Dadra and Nagar Haveli and Daman and Diu", value: 1.8 }
];

const INDIA_CITY_ANALYTICS: Array<{ state: string; city: string; value: number }> = [
  { state: "Delhi (NCT)", city: "New Delhi", value: 2.8 },
  { state: "Delhi (NCT)", city: "Dwarka", value: 2.6 },
  { state: "Maharashtra", city: "Mumbai", value: 2.2 },
  { state: "Maharashtra", city: "Pune", value: 1.9 },
  { state: "Maharashtra", city: "Nagpur", value: 1.8 },
  { state: "Gujarat", city: "Surat", value: 2.6 },
  { state: "Gujarat", city: "Ahmedabad", value: 2.4 },
  { state: "Gujarat", city: "Vadodara", value: 2.2 },
  { state: "Tamil Nadu", city: "Chennai", value: 2.1 },
  { state: "Karnataka", city: "Bengaluru", value: 1.6 },
  { state: "West Bengal", city: "Kolkata", value: 2.0 },
  { state: "Telangana", city: "Hyderabad", value: 1.8 },
  { state: "Uttar Pradesh", city: "Lucknow", value: 1.1 },
  { state: "Kerala", city: "Kochi", value: 1.2 },
  { state: "Odisha", city: "Bhubaneswar", value: 1.7 },
  { state: "Haryana", city: "Gurugram", value: 2.6 },
  { state: "Haryana", city: "Faridabad", value: 2.1 },
  { state: "Rajasthan", city: "Jaipur", value: 1.5 },
  { state: "Madhya Pradesh", city: "Indore", value: 1.6 },
  { state: "Assam", city: "Guwahati", value: 1.0 }
];

function normalizeResponse(): CarbonAnalyticsDocument {
  return {
    nationalAverage: 1.8,
    stateValues: Object.fromEntries(INDIA_STATE_ANALYTICS.map((entry) => [entry.state, entry.value])),
    cityValues: INDIA_CITY_ANALYTICS.map((entry) => ({ state: entry.state, name: entry.city, value: entry.value })),
    source: FALLBACK_SOURCE,
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

async function fetchCarbonAnalyticsFromUpstream(): Promise<CarbonAnalyticsResponse> {
  const endpoint = process.env.CARBON_ANALYTICS_SOURCE_URL;
  if (!endpoint) {
    return {
      nationalAverage: 1.8,
      states: INDIA_STATE_ANALYTICS.map((entry) => ({ state: entry.state, value: entry.value })),
      cities: INDIA_CITY_ANALYTICS.map((entry) => ({ state: entry.state, city: entry.city, value: entry.value })),
      source: FALLBACK_SOURCE
    };
  }

  const res = await fetch(endpoint, {
    headers: process.env.CARBON_ANALYTICS_SOURCE_KEY
      ? { Authorization: `Bearer ${process.env.CARBON_ANALYTICS_SOURCE_KEY}` }
      : undefined
  });

  if (!res.ok) {
    throw new Error(`Upstream analytics request failed: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as CarbonAnalyticsResponse;
}

export const syncIndiaCarbonAnalytics = onSchedule("every 6 hours", async () => {
  const payload = await fetchCarbonAnalyticsFromUpstream();
  const normalized = {
    nationalAverage: payload.nationalAverage,
    stateValues: Object.fromEntries(payload.states.map((entry) => [entry.state, entry.value])),
    cityValues: payload.cities.map((entry) => ({ state: entry.state, name: entry.city, value: entry.value })),
    source: payload.source,
    updatedAt: new Date().toISOString(),
    version: 1
  } satisfies CarbonAnalyticsDocument;
  await db.doc(DOC_PATH).set(normalized, { merge: true });
});

export const getIndiaCarbonAnalytics = onRequest(async (_req, res) => {
  try {
    const payload = await fetchCarbonAnalyticsFromUpstream();
    res.json(payload);
  } catch (error) {
    console.error(error);

    const doc = await db.doc(DOC_PATH).get();
    if (doc.exists) {
      res.json({
        nationalAverage: Number(doc.data()?.nationalAverage) || 1.8,
        states: Object.entries(doc.data()?.stateValues ?? {}).map(([state, value]) => ({ state, value: Number(value) })),
        cities: (doc.data()?.cityValues ?? []).map((entry: { state: string; name: string; value: number }) => ({
          state: entry.state,
          city: entry.name,
          value: Number(entry.value)
        })),
        source: doc.data()?.source ?? FALLBACK_SOURCE
      } satisfies CarbonAnalyticsResponse);
      return;
    }

    res.json({
      nationalAverage: 1.8,
      states: INDIA_STATE_ANALYTICS.map((entry) => ({ state: entry.state, value: entry.value })),
      cities: INDIA_CITY_ANALYTICS.map((entry) => ({ state: entry.state, city: entry.city, value: entry.value })),
      source: FALLBACK_SOURCE
    } satisfies CarbonAnalyticsResponse);
  }
});
