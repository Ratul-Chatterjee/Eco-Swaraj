import { db, isFirebaseConfigured } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { fetchLiveCarbonAnalytics } from "./liveAnalyticsSource";
import type { CarbonAnalyticsDoc } from "./carbonAnalyticsContract";

const ENABLE_LIVE_ANALYTICS_SYNC = import.meta.env.VITE_ENABLE_LIVE_ANALYTICS_SYNC === "true";
const LIVE_ANALYTICS_REFRESH_MS = Number(import.meta.env.VITE_LIVE_ANALYTICS_REFRESH_MS || 15 * 60 * 1000);

export const syncLiveCarbonAnalyticsToFirestore = async (): Promise<CarbonAnalyticsDoc | null> => {
  try {
    const liveData = await fetchLiveCarbonAnalytics();
    if (!liveData || !isFirebaseConfigured || !db) return liveData;
    await setDoc(doc(db, "publicAnalytics", "indiaCarbon"), liveData, { merge: true });
    return liveData;
  } catch (error) {
    console.error("Live carbon analytics sync failed:", error);
    return null;
  }
};

export const startLiveAnalyticsSync = () => {
  if (!ENABLE_LIVE_ANALYTICS_SYNC) return () => undefined;
  void syncLiveCarbonAnalyticsToFirestore();
  const timer = window.setInterval(() => void syncLiveCarbonAnalyticsToFirestore(), Math.max(60_000, LIVE_ANALYTICS_REFRESH_MS));
  return () => window.clearInterval(timer);
};
