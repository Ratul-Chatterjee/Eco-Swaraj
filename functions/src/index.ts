import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import type { CarbonAnalyticsDocument, CarbonAnalyticsResponse } from "./carbonAnalyticsContract";

admin.initializeApp();

const db = admin.firestore();
const DOC_PATH = "publicAnalytics/indiaCarbon";
const DEFAULT_SOURCE_URL = "/api/carbon-analytics";

const FALLBACK_SOURCE = {
  provider: "Configured backend job",
  dataset: "India carbon analytics pipeline",
  generatedAt: new Date().toISOString(),
  freshness: "24h"
};

function normalizeResponse(payload: CarbonAnalyticsResponse): CarbonAnalyticsDocument {
  const stateValues = Object.fromEntries(payload.states.map((entry) => [entry.state, entry.value]));
  return {
    nationalAverage: payload.nationalAverage,
    stateValues,
    cityValues: payload.cities.map((entry) => ({ state: entry.state, name: entry.city, value: entry.value })),
    source: payload.source,
    updatedAt: new Date().toISOString(),
    version: 1
  };
}

async function fetchCarbonAnalyticsFromUpstream(): Promise<CarbonAnalyticsResponse> {
  const endpoint = process.env.CARBON_ANALYTICS_SOURCE_URL || DEFAULT_SOURCE_URL;
  const isRelative = endpoint.startsWith("/");
  if (isRelative) {
    const doc = await db.doc(DOC_PATH).get();
    if (doc.exists) {
      return {
        nationalAverage: Number(doc.data()?.nationalAverage) || 1.8,
        states: Object.entries(doc.data()?.stateValues ?? {}).map(([state, value]) => ({ state, value: Number(value) })),
        cities: (doc.data()?.cityValues ?? []).map((entry: { state: string; name: string; value: number }) => ({
          state: entry.state,
          city: entry.name,
          value: Number(entry.value)
        })),
        source: doc.data()?.source ?? FALLBACK_SOURCE
      };
    }
    throw new Error("No cached analytics document available yet.");
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
  const normalized = normalizeResponse(payload);
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

    res.status(500).json({
      nationalAverage: 1.8,
      states: [],
      cities: [],
      source: FALLBACK_SOURCE
    } satisfies CarbonAnalyticsResponse);
  }
});
