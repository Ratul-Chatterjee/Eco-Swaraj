import React, { useEffect, useMemo, useState } from "react";
import indiaSvgMarkup from "../../assets/indiamap.svg?raw";
import { fallbackStateValues, subscribeToCarbonAnalytics } from "../../services/carbonAnalytics";
import type { CarbonAnalyticsDocument as CarbonAnalyticsDoc } from "../../services/carbonAnalyticsContract";
import { buildIndiaRegionAliasLookup, INDIA_MAP_REGIONS, INDIA_REGION_LOOKUP, normalizeIndiaRegionName } from "../../data/indiaMapRegions";

const FALLBACK_NATIONAL_AVERAGE = 1.8;

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

  const regionAliasLookup = useMemo(() => buildIndiaRegionAliasLookup(), []);
  const liveNationalAverage = analytics?.nationalAverage ?? FALLBACK_NATIONAL_AVERAGE;

  const valuesByState = useMemo(() => {
    const merged = { ...fallbackStateValues, ...(analytics?.stateValues ?? {}) };
    const normalized = new Map<string, number>();
    Object.entries(merged).forEach(([key, value]) => {
      normalized.set(normalizeIndiaRegionName(key), value);
    });
    return normalized;
  }, [analytics]);

  const resolveRegionValue = (regionName: string) => {
    const canonical = regionAliasLookup.get(normalizeIndiaRegionName(regionName)) ?? regionName;
    return valuesByState.get(normalizeIndiaRegionName(canonical)) ?? valuesByState.get(normalizeIndiaRegionName(regionName)) ?? liveNationalAverage;
  };

  useEffect(() => {
    const doc = new DOMParser().parseFromString(indiaSvgMarkup, "image/svg+xml");
    Array.from(doc.querySelectorAll("path")).forEach((path, index) => {
      const region = INDIA_REGION_LOOKUP.get(index + 1) ?? INDIA_MAP_REGIONS[index] ?? { name: `Region ${index + 1}` };
      const canonicalName = regionAliasLookup.get(normalizeIndiaRegionName(region.name)) ?? region.name;
      const value = resolveRegionValue(canonicalName);
      const band = getBand(value);
      path.setAttribute("data-region-name", canonicalName);
      path.setAttribute("data-region-value", String(value));
      path.setAttribute("fill", band.fill);
      path.setAttribute("stroke", band.stroke);
      path.setAttribute("stroke-width", "2.5");
      path.setAttribute("vector-effect", "non-scaling-stroke");
      path.setAttribute("style", "cursor:pointer;transition:fill .2s ease,stroke .2s ease;filter:drop-shadow(0 2px 4px rgba(0,0,0,.18));");
    });
    setSvgMarkup(new XMLSerializer().serializeToString(doc));
  }, [liveNationalAverage, regionAliasLookup, resolveRegionValue, valuesByState]);

  return (
    <section style={{ width: "100%", padding: "0 0 24px", background: "none" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ textAlign: "center" }}>
          <h3 style={{ fontSize: "clamp(1.5rem, 2vw, 2.1rem)", margin: 0 }}>India Carbon Footprint Map</h3>
          <p style={{ marginTop: 8, color: "var(--text-secondary)", maxWidth: 860, marginLeft: "auto", marginRight: "auto" }}>
            Hover any state or union territory to see its yearly per-capita carbon footprint. Green marks lower emissions than the India average, yellow is near the average, and red is higher.
          </p>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          {hovered && (
            <div style={{ position: "absolute", left: tooltipPos.x, top: tooltipPos.y, zIndex: 2, padding: "10px 14px", borderRadius: 14, background: "rgba(6, 10, 18, 0.92)", border: "1px solid var(--glass-border)", color: "var(--text-primary)", boxShadow: "var(--shadow-glass)", pointerEvents: "none", transform: "translate(-50%, -115%)", whiteSpace: "nowrap" }}>
              <div style={{ fontWeight: 700 }}>{hovered.name}</div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{hovered.value.toFixed(1)} tCO2e/year</div>
            </div>
          )}

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
            style={{ width: "100%", minHeight: "220px", padding: 0, background: "none", display: "flex", justifyContent: "center", alignItems: "center", overflow: "visible", maxWidth: "100%" }}
            dangerouslySetInnerHTML={{ __html: svgMarkup.replace("<svg ", '<svg viewBox="0 0 1200 1200" preserveAspectRatio="xMidYMid meet" width="78%" height="78%" style="display:block;max-width:78%;margin:0 auto;" ') }}
          />
        </div>
      </div>
    </section>
  );
};
