export type CarbonStateValue = {
  state: string;
  value: number;
  source?: string;
  updatedAt?: string;
};

export type CarbonCityValue = {
  state: string;
  city: string;
  value: number;
  source?: string;
  updatedAt?: string;
};

export type CarbonAnalyticsResponse = {
  nationalAverage: number;
  states: CarbonStateValue[];
  cities: CarbonCityValue[];
  source: {
    provider: string;
    dataset: string;
    generatedAt: string;
    freshness: string;
  };
};

export type CarbonAnalyticsDocument = {
  nationalAverage: number;
  stateValues: Record<string, number>;
  cityValues: Array<{ state: string; name: string; value: number }>;
  source: {
    provider: string;
    dataset: string;
    generatedAt: string;
    freshness: string;
  };
  updatedAt: string;
  version: number;
};

export type CarbonAnalyticsDoc = CarbonAnalyticsDocument;

export const CARBON_ANALYTICS_DOC_PATH = "publicAnalytics/indiaCarbon";
