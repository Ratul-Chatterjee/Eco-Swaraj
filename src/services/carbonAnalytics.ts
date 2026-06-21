import { db, isFirebaseConfigured } from "./firebase";
import { doc, onSnapshot } from "firebase/firestore";
import type { CarbonAnalyticsDocument as SharedCarbonAnalyticsDoc } from "./carbonAnalyticsContract";
import { normalizeIndiaRegionName } from "../data/indiaMapRegions";
import { fetchLiveCarbonAnalytics } from "./liveAnalyticsSource";

export type CarbonAnalyticsStateMap = Record<string, number>;
export type CarbonAnalyticsDoc = SharedCarbonAnalyticsDoc;

const FALLBACK_NATIONAL_AVERAGE = 1.8;

export const fallbackStateValues: CarbonAnalyticsStateMap = {
  "Jammu & Kashmir": 1.8,
  Ladakh: 1.8,
  "Himachal Pradesh": 1.8,
  Punjab: 1.8,
  Haryana: 1.9,
  "Delhi (NCT)": 2.8,
  Uttarakhand: 1.8,
  Rajasthan: 1.4,
  "Uttar Pradesh": 1.2,
  Bihar: 0.6,
  Sikkim: 1.8,
  "Arunachal Pradesh": 0.7,
  Assam: 0.8,
  Meghalaya: 1.8,
  Nagaland: 1.8,
  Manipur: 1.8,
  Mizoram: 1.8,
  Tripura: 1.8,
  "West Bengal": 1.8,
  Gujarat: 2.5,
  "Madhya Pradesh": 1.5,
  Chhattisgarh: 1.8,
  Jharkhand: 1.8,
  Odisha: 2.2,
  Maharashtra: 2.0,
  Goa: 1.8,
  Karnataka: 1.5,
  Telangana: 1.6,
  "Andhra Pradesh": 1.7,
  Kerala: 1.0,
  "Tamil Nadu": 1.7,
  Puducherry: 1.8,
  "Andaman and Nicobar Islands": 1.8,
  Lakshadweep: 1.8,
  Chandigarh: 1.8,
  "Dadra and Nagar Haveli and Daman and Diu": 1.8
};

export const getFallbackStateValue = (stateName: string) => {
  return fallbackStateValues[normalizeIndiaRegionName(stateName)] ?? fallbackStateValues[stateName] ?? FALLBACK_NATIONAL_AVERAGE;
};

export const subscribeToCarbonAnalytics = (onData: (data: CarbonAnalyticsDoc | null) => void) => {
  let liveFallbackUsed = false;

  const pullLiveFallback = async () => {
    if (liveFallbackUsed) return;
    liveFallbackUsed = true;
    try {
      const liveData = await fetchLiveCarbonAnalytics();
      onData(liveData);
    } catch (error) {
      console.error("Failed to fetch live carbon analytics directly:", error);
      onData(null);
    }
  };

  if (!isFirebaseConfigured || !db) {
    void pullLiveFallback();
    return () => undefined;
  }

  const ref = doc(db, "publicAnalytics", "indiaCarbon");
  return onSnapshot(
    ref,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as CarbonAnalyticsDoc);
        return;
      }
      void pullLiveFallback();
    },
    (error) => {
      console.error("Failed to subscribe to carbon analytics:", error);
      void pullLiveFallback();
    }
  );
};
