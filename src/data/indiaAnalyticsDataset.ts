export type AnalyticsStateEntry = { state: string; value: number };
export type AnalyticsCityEntry = { state: string; city: string; value: number };

export const ANALYTICS_DATASET_YEAR = 2014;

export const INDIA_STATE_ANALYTICS: AnalyticsStateEntry[] = [
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

export const INDIA_CITY_ANALYTICS: AnalyticsCityEntry[] = [
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

export const INDIA_ANALYTICS_SOURCE = {
  provider: "Eco-Swaraj dataset pipeline",
  dataset: `India carbon analytics dataset (${ANALYTICS_DATASET_YEAR})`,
  generatedAt: new Date().toISOString(),
  freshness: "static snapshot"
};
