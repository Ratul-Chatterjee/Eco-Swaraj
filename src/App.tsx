import React from "react";
import { UserProvider, useUser } from "./contexts/UserContext";
import { GameProvider } from "./contexts/GameContext";
import { LandingPage } from "./components/Auth/LandingPage";
import { OnboardingCalculator } from "./components/Tracker/OnboardingCalculator";
import { UserDashboard } from "./components/Dashboard/UserDashboard";
import { FirebaseConfigOverlay } from "./components/Common/FirebaseConfigOverlay";
import { SiteFooter } from "./components/Common/SiteFooter";
import { startLiveAnalyticsSync } from "./services/liveAnalyticsSync";

const enableClientSync = import.meta.env.VITE_ENABLE_LIVE_ANALYTICS_SYNC === "true";

const AppContent: React.FC = () => {
  const { user, userProfile, loading, firebaseError } = useUser();

  React.useEffect(() => {
    if (!enableClientSync) return undefined;
    return startLiveAnalyticsSync();
  }, []);

  if (firebaseError) {
    return <FirebaseConfigOverlay />;
  }

  if (loading) {
    return (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "16px",
        background: "var(--bg-gradient)",
        backgroundColor: "var(--bg-dark)"
      }}>
        <div className="animate-pulse-glow" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <img src="/logo.png" alt="Eco-Swaraj Logo" style={{ width: "80px", height: "80px", objectFit: "contain" }} />
        </div>
        <p style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          fontWeight: "500",
          color: "var(--text-secondary)",
          letterSpacing: "0.05em"
        }}>
          Loading Eco-Swaraj Portal...
        </p>
      </div>
    );
  }

  if (!user || (user && !user.emailVerified)) {
    return <LandingPage />;
  }

  if (!userProfile || !userProfile.isCalculated) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        padding: "20px",
        background: "var(--bg-gradient)",
        backgroundColor: "var(--bg-dark)"
      }}>
        <div style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <OnboardingCalculator />
        </div>
        <SiteFooter />
      </div>
    );
  }

  return <UserDashboard />;
};

function App() {
  return (
    <UserProvider>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </UserProvider>
  );
}

export default App;
