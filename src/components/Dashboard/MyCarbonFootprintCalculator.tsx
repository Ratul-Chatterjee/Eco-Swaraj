import React, { useState } from "react";
import { Calculator, RotateCcw } from "lucide-react";

const COMMON_INDIAN_AVERAGE = 1.8; // tonnes CO2e/year

export const MyCarbonFootprintCalculator: React.FC = () => {
  const [vehicleType, setVehicleType] = useState("none");
  const [weeklyMileage, setWeeklyMileage] = useState(0);
  const [publicTransit, setPublicTransit] = useState("none");
  const [electricityBill, setElectricityBill] = useState(0);
  const [cookingFuel, setCookingFuel] = useState("lpg");
  const [diet, setDiet] = useState("balanced");
  const [wasteHabit, setWasteHabit] = useState("average");
  const [result, setResult] = useState<number | null>(null);
  const [summary, setSummary] = useState<string>("");

  const calculateFootprint = () => {
    let totalCO2 = 0;

    const estimatedKWhPerMonth = electricityBill / 7;
    const annualKWh = estimatedKWhPerMonth * 12;
    totalCO2 += (annualKWh * 0.75) / 1000;

    if (cookingFuel === "lpg") totalCO2 += 0.25;
    if (cookingFuel === "png") totalCO2 += 0.2;
    if (cookingFuel === "electric") totalCO2 += 0.1;

    let transportFactor = 0;
    if (vehicleType === "petrol_car") transportFactor = 0.18;
    else if (vehicleType === "diesel_car") transportFactor = 0.19;
    else if (vehicleType === "cng_car") transportFactor = 0.12;
    else if (vehicleType === "two_wheeler") transportFactor = 0.08;
    else if (vehicleType === "ev_car") transportFactor = 0.04;

    totalCO2 += (weeklyMileage * 52 * transportFactor) / 1000;

    if (publicTransit === "low") totalCO2 += (30 * 52 * 0.04) / 1000;
    if (publicTransit === "medium") totalCO2 += (100 * 52 * 0.04) / 1000;
    if (publicTransit === "high") totalCO2 += (250 * 52 * 0.04) / 1000;

    if (diet === "heavy_meat") totalCO2 += 2.2;
    if (diet === "balanced") totalCO2 += 1.6;
    if (diet === "vegetarian") totalCO2 += 1.0;
    if (diet === "vegan") totalCO2 += 0.6;

    if (wasteHabit === "compost") totalCO2 += 0.2;
    if (wasteHabit === "average") totalCO2 += 0.35;
    if (wasteHabit === "high_waste") totalCO2 += 0.5;

    return Number(totalCO2.toFixed(2));
  };

  const handleCalculate = () => {
    const footprint = calculateFootprint();
    setResult(footprint);

    if (footprint < COMMON_INDIAN_AVERAGE) {
      setSummary(
        `Your estimated footprint is below the common Indian average of ${COMMON_INDIAN_AVERAGE} tCO2e/year. That means you are currently emitting less carbon than average.`
      );
    } else if (footprint > COMMON_INDIAN_AVERAGE) {
      setSummary(
        `Your estimated footprint is above the common Indian average of ${COMMON_INDIAN_AVERAGE} tCO2e/year. That means you are currently emitting more carbon than average.`
      );
    } else {
      setSummary(
        `Your estimated footprint matches the common Indian average of ${COMMON_INDIAN_AVERAGE} tCO2e/year.`
      );
    }
  };

  const handleReset = () => {
    setVehicleType("none");
    setWeeklyMileage(0);
    setPublicTransit("none");
    setElectricityBill(0);
    setCookingFuel("lpg");
    setDiet("balanced");
    setWasteHabit("average");
    setResult(null);
    setSummary("");
  };

  return (
    <section className="glass-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Calculator color="var(--color-primary)" size={22} />
          <h3 style={{ fontSize: "1.25rem" }}>My Carbon Footprint Calculator</h3>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <RotateCcw size={14} />
          Reset
        </button>
      </div>

      <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
        Answer a few basic lifestyle questions to estimate your annual carbon footprint. This calculator stays only in memory, so the result disappears when you leave the page or log out.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "16px" }}>
        <div className="form-group">
          <label className="form-label">Primary Vehicle</label>
          <select className="glass-input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ width: "100%" }}>
            <option value="none">No personal vehicle</option>
            <option value="petrol_car">Petrol Car</option>
            <option value="diesel_car">Diesel Car</option>
            <option value="cng_car">CNG Car</option>
            <option value="two_wheeler">Two-wheeler</option>
            <option value="ev_car">Electric Vehicle</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Weekly Driving Distance</label>
          <input
            className="glass-input"
            type="number"
            min={0}
            value={weeklyMileage || ""}
            onChange={(e) => setWeeklyMileage(Math.max(0, parseInt(e.target.value) || 0))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Public Transport Use</label>
          <select className="glass-input" value={publicTransit} onChange={(e) => setPublicTransit(e.target.value)} style={{ width: "100%" }}>
            <option value="none">Rarely / Never</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Monthly Electricity Bill (INR)</label>
          <input
            className="glass-input"
            type="number"
            min={0}
            value={electricityBill || ""}
            onChange={(e) => setElectricityBill(Math.max(0, parseInt(e.target.value) || 0))}
            style={{ width: "100%" }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cooking Fuel</label>
          <select className="glass-input" value={cookingFuel} onChange={(e) => setCookingFuel(e.target.value)} style={{ width: "100%" }}>
            <option value="lpg">LPG</option>
            <option value="png">PNG</option>
            <option value="electric">Electric / Induction</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Diet Type</label>
          <select className="glass-input" value={diet} onChange={(e) => setDiet(e.target.value)} style={{ width: "100%" }}>
            <option value="heavy_meat">Meat-intensive</option>
            <option value="balanced">Balanced</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Waste Habit</label>
          <select className="glass-input" value={wasteHabit} onChange={(e) => setWasteHabit(e.target.value)} style={{ width: "100%" }}>
            <option value="high_waste">High waste / low recycling</option>
            <option value="average">Average</option>
            <option value="compost">Composting / low waste</option>
          </select>
        </div>
      </div>

      <button className="btn btn-primary" onClick={handleCalculate} style={{ alignSelf: "flex-start", display: "flex", gap: "8px" }}>
        Calculate My Carbon Footprint
      </button>

      {result !== null && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "18px",
            borderRadius: "var(--radius-sm)",
            background: "hsla(222, 47%, 7%, 0.35)",
            border: "1px solid var(--glass-border)"
          }}
        >
          <strong style={{ fontSize: "1.05rem" }}>Estimated Annual Footprint: {result} tCO2e</strong>
          <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.6 }}>{summary}</p>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            This result is calculated only from the inputs you enter here and is not saved anywhere.
          </p>
        </div>
      )}
    </section>
  );
};
