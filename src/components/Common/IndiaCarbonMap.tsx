import React, { useEffect, useMemo, useState } from "react";
import indiaSvgMarkup from "../../assets/indiamap.svg?raw";
import { subscribeToCarbonAnalytics } from "../../services/carbonAnalytics";
import type { CarbonAnalyticsDocument as CarbonAnalyticsDoc } from "../../services/carbonAnalyticsContract";
import { normalizeIndiaRegionName } from "../../data/indiaMapRegions";
import { ANALYTICS_DATASET_YEAR } from "../../data/indiaAnalyticsDataset";

const FALLBACK_NATIONAL_AVERAGE = 1.8;
const LANDING_MAP_DATA_YEAR = ANALYTICS_DATASET_YEAR;
const CARBON_ANALYTICS_SOURCE_URL = "https://us-central1-eco-swaraj.cloudfunctions.net/getIndiaCarbonAnalytics";

const STATE_DATA_SOURCE_URL = CARBON_ANALYTICS_SOURCE_URL;
const CITY_DATA_SOURCE_URL = CARBON_ANALYTICS_SOURCE_URL;

const REGION_CODE_TO_NAME: Record<string, string> = {
  "IN-AN": "Andaman and Nicobar Islands",
  "IN-AP": "Andhra Pradesh",
  "IN-AR": "Arunachal Pradesh",
  "IN-AS": "Assam",
  "IN-BR": "Bihar",
  "IN-CH": "Chandigarh",
  "IN-CT": "Chhattisgarh",
  "IN-DH": "Dadra and Nagar Haveli and Daman and Diu",
  "IN-DL": "Delhi (NCT)",
  "IN-GA": "Goa",
  "IN-GJ": "Gujarat",
  "IN-HP": "Himachal Pradesh",
  "IN-HR": "Haryana",
  "IN-JH": "Jharkhand",
  "IN-JK": "Jammu & Kashmir",
  "IN-KA": "Karnataka",
  "IN-KL": "Kerala",
  "IN-LA": "Ladakh",
  "IN-LD": "Lakshadweep",
  "IN-MH": "Maharashtra",
  "IN-ML": "Meghalaya",
  "IN-MN": "Manipur",
  "IN-MP": "Madhya Pradesh",
  "IN-MZ": "Mizoram",
  "IN-NL": "Nagaland",
  "IN-OR": "Odisha",
  "IN-PB": "Punjab",
  "IN-PY": "Puducherry",
  "IN-RJ": "Rajasthan",
  "IN-SK": "Sikkim",
  "IN-TG": "Telangana",
  "IN-TN": "Tamil Nadu",
  "IN-TR": "Tripura",
  "IN-UP": "Uttar Pradesh",
  "IN-UT": "Uttarakhand",
  "IN-WB": "West Bengal"
};

type MapRegion = { name: string; value: number };

const getBand = (value: number) => {
  if (value < FALLBACK_NATIONAL_AVERAGE * 0.95) return { fill: "#19d36b", stroke: "#0ea45d" };
  if (value > FALLBACK_NATIONAL_AVERAGE * 1.05) return { fill: "#ff5f5f", stroke: "#d24747" };
  return { fill: "#ffd34d", stroke: "#c49f1f" };
};

export const IndiaCarbonMap: React.FC = () => {
  const [hovered, setHovered] = useState<MapRegion | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [svgMarkup, setSvgMarkup] = useState("");
  const [analytics, setAnalytics] = useState<CarbonAnalyticsDoc | null>(null);

  useEffect(() => subscribeToCarbonAnalytics(setAnalytics), []);

  const liveNationalAverage = analytics?.nationalAverage ?? FALLBACK_NATIONAL_AVERAGE;

  const valuesByState = useMemo(() => {
    const normalized = new Map<string, number>();
    Object.entries(analytics?.stateValues ?? {}).forEach(([key, value]) => {
      normalized.set(normalizeIndiaRegionName(key), value);
    });
    return normalized;
  }, [analytics]);

  const resolveRegionValue = (regionName: string) => {
    return valuesByState.get(normalizeIndiaRegionName(regionName)) ?? liveNationalAverage;
  };

  useEffect(() => {
    const doc = new DOMParser().parseFromString(indiaSvgMarkup, "image/svg+xml");

    Array.from(doc.querySelectorAll("path.region[id^='IN-']")).forEach((path) => {
      const regionCode = path.getAttribute("id") ?? "";
      const canonicalName = REGION_CODE_TO_NAME[regionCode] ?? regionCode;
      const value = resolveRegionValue(canonicalName);
      const band = getBand(value);
      path.setAttribute("data-region-name", canonicalName);
      path.setAttribute("data-region-value", String(value));
      path.setAttribute("fill", band.fill);
      path.setAttribute("stroke", band.stroke);
      path.setAttribute("stroke-width", "1.6");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.setAttribute("style", "cursor:pointer;transition:fill .2s ease,stroke .2s ease;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18));");
    });

    setSvgMarkup(new XMLSerializer().serializeToString(doc));
  }, [liveNationalAverage, valuesByState]);

  return (
    <section style={{ width: "100%", padding: "0 0 24px", background: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "clamp(1.5rem, 2vw, 2.1rem)", margin: 0 }}>India Carbon Footprint Map</h3>
          <p style={{ marginTop: 8, color: "var(--text-secondary)", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Hover any state or union territory to see its yearly per-capita carbon footprint. Green marks lower emissions than the India average, yellow is near the average, and red is higher.
          </p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 6, alignItems: "center", color: "var(--text-muted)", fontSize: "0.85rem" }}>
            <div>Map and statistics are shown using {LANDING_MAP_DATA_YEAR} data.</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", justifyContent: "center" }}>
              <a href={STATE_DATA_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>
                State data source URL (live analytics)
              </a>
              <a href={CITY_DATA_SOURCE_URL} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)" }}>
                City data source URL (live analytics)
              </a>
            </div>
          </div>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          {hovered && (
            <div style={{ position: "absolute", left: tooltipPos.x, top: tooltipPos.y, zIndex: 2, padding: "10px 14px", borderRadius: 14, background: "rgba(6, 10, 18, 0.92)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", boxShadow: "var(--shadow-glass)", pointerEvents: "none", transform: "translate(-50%, -115%)", whiteSpace: "nowrap" }}>
              <div style={{ fontWeight: 700 }}>{hovered.name}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{hovered.value.toFixed(1)} tCO2e/year</div>
            </div>
          )}

          <div style={{ width: "100%", minHeight: "220px", padding: 0, background: "none", display: "flex", justifyContent: "center", alignItems: "center", overflow: "visible", maxWidth: "100%", position: "relative" }}>
            <div
              onMouseMove={(event) => {
                const target = event.target as SVGElement | null;
                const regionName = target?.getAttribute?.("data-region-name");
                const regionValue = target?.getAttribute?.("data-region-value");
                if (!regionName || !regionValue) return;
                setHovered({ name: regionName, value: Number(regionValue) });
                const bounds = (event.currentTarget as HTMLDivElement).getBoundingClientRect();
                setTooltipPos({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
              }}
              onMouseLeave={() => setHovered(null)}
              style={{ width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}
              dangerouslySetInnerHTML={{
                __html: svgMarkup.replace(
                  "<svg ",
                  `<svg preserveAspectRatio="xMidYMid meet" width="100%" height="100%" style="display:block;max-width:100%;margin:0 auto;" viewBox="0 0 1200 1200" `
                ),
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};
