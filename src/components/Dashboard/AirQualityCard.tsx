import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { fetchAirQuality } from "../../services/airQuality";
import type { AirQualityMetrics } from "../../services/airQuality";
import { Wind, RefreshCw, AlertCircle } from "lucide-react";

async function geocodeLocation(city: string, state: string) {
  const query = [city, state, "India"].filter(Boolean).join(", ");
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
  const response = await fetch(url);
  if (!response.ok) return null;
  const data = await response.json();
  const result = data?.results?.[0];
  if (!result) return null;
  return { lat: result.latitude as number, lng: result.longitude as number };
}

export const AirQualityCard: React.FC = () => {
  const { userProfile } = useUser();
  const [aqiData, setAqiData] = useState<AirQualityMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const city = userProfile?.city;
  const state = userProfile?.state;

  const loadAQI = async () => {
    if (!city || !state) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const coords = await geocodeLocation(city, state);
      if (!coords) {
        throw new Error("Unable to geocode user location.");
      }
      const metrics = await fetchAirQuality(coords.lat, coords.lng);
      setAqiData(metrics);
    } catch (err) {
      console.error("AQI load error:", err);
      setAqiData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAQI();
  }, [city, state]);

  if (!city || !state) return null;

  return (
    <div className="glass-card" style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", background: aqiData ? `${aqiData.color}08` : "transparent", pointerEvents: "none" }} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Wind size={20} color="var(--color-secondary)" />
          <h4 style={{ fontSize: "1.1rem" }}>Local Air Quality Index</h4>
        </div>
        <button onClick={() => void loadAQI()} disabled={loading} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", display: "flex", alignItems: "center" }}>
          <RefreshCw size={14} className={loading ? "animate-spin-slow" : ""} />
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "20px 0", textAlign: "center", color: "var(--text-muted)" }}>
          Loading real-time air quality...
        </div>
      ) : aqiData ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
            <div style={{ background: `radial-gradient(circle, ${aqiData.color}15 0%, transparent 100%)`, border: `2px solid ${aqiData.color}`, width: "72px", height: "72px", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px 0 ${aqiData.color}15`, flexShrink: 0 }}>
              <span style={{ fontSize: "1.6rem", fontWeight: "800", color: "#fff", lineHeight: "1" }}>{aqiData.aqi}</span>
              <span style={{ fontSize: "0.65rem", color: "var(--text-secondary)", fontWeight: "600", textTransform: "uppercase" }}>US AQI</span>
            </div>

            <div>
              <div style={{ fontSize: "1.2rem", fontWeight: "700", color: aqiData.color }}>{aqiData.label}</div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                Active in <strong>{city}</strong>, {state}
              </div>
            </div>
          </div>

          <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: "1.4", borderLeft: `3px solid ${aqiData.color}`, paddingLeft: "10px" }}>
            {aqiData.description}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", background: "hsla(222, 47%, 7%, 0.4)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", textAlign: "center" }}>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PM2.5</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#fff", marginTop: "2px" }}>{aqiData.pm25} <span style={{ fontSize: "0.65rem", fontWeight: "400", color: "var(--text-muted)" }}>µg</span></div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>PM10</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#fff", marginTop: "2px" }}>{aqiData.pm10} <span style={{ fontSize: "0.65rem", fontWeight: "400", color: "var(--text-muted)" }}>µg</span></div>
            </div>
            <div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Ozone</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#fff", marginTop: "2px" }}>{aqiData.o3} <span style={{ fontSize: "0.65rem", fontWeight: "400", color: "var(--text-muted)" }}>µg</span></div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", background: "var(--glass-bg)", border: "1px solid var(--glass-border)", padding: "10px", borderRadius: "var(--radius-sm)", alignItems: "flex-start", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: "1px", color: "var(--color-secondary)" }} />
            <div>
              {aqiData.aqi > 100
                ? "Poor air quality detected. Avoid high outdoor physical workloads. Offset your carbon impact indoors by turning off idling electronics!"
                : "Air quality is good! Walk, cycle, or use public transport to commute today, earning Carbon Coins while keeping emissions low."}
            </div>
          </div>
        </div>
      ) : (
        <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
          Unable to retrieve air quality data.
        </div>
      )}
    </div>
  );
};
