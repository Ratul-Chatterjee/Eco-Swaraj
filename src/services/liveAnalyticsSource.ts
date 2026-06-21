import type { CarbonAnalyticsDoc, CarbonAnalyticsResponse } from "./carbonAnalyticsContract";

const CARBON_ANALYTICS_URL = import.meta.env.VITE_CARBON_ANALYTICS_URL as string | undefined;
const CARBON_ANALYTICS_API_KEY = import.meta.env.VITE_CARBON_ANALYTICS_API_KEY as string | undefined;
const FALLBACK_NATIONAL_AVERAGE = 1.8;
const DEFAULT_CARBON_ANALYTICS_URL = "https://us-central1-eco-swaraj.cloudfunctions.net/getIndiaCarbonAnalytics";

type ExternalCarbonPayload = CarbonAnalyticsResponse;

export const normalizeCarbonPayload = (payload: ExternalCarbonPayload | null | undefined): CarbonAnalyticsDoc => {
  const stateValues = Object.fromEntries((payload?.states ?? []).map((region) => [region.state, region.value]));
  return {
    nationalAverage: Number(payload?.nationalAverage) || FALLBACK_NATIONAL_AVERAGE,
    stateValues,
    cityValues: (payload?.cities ?? []).map((entry) => ({ state: entry.state, name: entry.city, value: entry.value })),
    source: payload?.source ?? {
      provider: "Configured backend job",
      dataset: "India carbon analytics pipeline",
      generatedAt: new Date().toISOString(),
      freshness: "24h"
    },
    updatedAt: new Date().toISOString(),
    version: 1
  };
};

export const fetchLiveCarbonAnalytics = async (): Promise<CarbonAnalyticsDoc | null> => {
  const url = CARBON_ANALYTICS_URL || DEFAULT_CARBON_ANALYTICS_URL;

  const response = await fetch(url, {
    headers: CARBON_ANALYTICS_API_KEY ? { Authorization: `Bearer ${CARBON_ANALYTICS_API_KEY}` } : undefined,
  });
  if (!response.ok) throw new Error(`Failed to fetch live carbon analytics: ${response.statusText}`);

  return normalizeCarbonPayload((await response.json()) as ExternalCarbonPayload);
};
