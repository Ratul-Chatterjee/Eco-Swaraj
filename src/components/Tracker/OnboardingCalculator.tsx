import React, { useMemo, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { MapPin, Car, Zap, Apple } from "lucide-react";
import { INDIA_STATE_OPTIONS, getCitiesForState } from "../../data/locationOptions";

export const OnboardingCalculator: React.FC = () => {
  const { updateCalculatorData } = useUser();
  const [step, setStep] = useState<number>(1);
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCity, setSelectedCity] = useState<string>("");
  const cityOptions = useMemo(() => getCitiesForState(selectedState), [selectedState]);
  const [vehicleType, setVehicleType] = useState<string>("none");
  const [mileage, setMileage] = useState<number>(0);
  const [publicTransit, setPublicTransit] = useState<string>("none");
  const [electricityBill, setElectricityBill] = useState<number>(0);
  const [cookingFuel, setCookingFuel] = useState<string>("lpg");
  const [diet, setDiet] = useState<string>("balanced");
  const [composting, setComposting] = useState<boolean>(false);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedState(e.target.value);
    setSelectedCity("");
  };

  const calculateFootprint = (): number => {
    const gridIntensity = 0.75;
    let totalCO2 = 0;

    const estimatedKWhPerMonth = electricityBill / 7;
    const annualKWh = estimatedKWhPerMonth * 12;
    totalCO2 += (annualKWh * gridIntensity) / 1000;

    if (cookingFuel === "lpg") totalCO2 += 0.25;
    else if (cookingFuel === "png") totalCO2 += 0.2;

    let transportFactor = 0;
    if (vehicleType === "petrol_car") transportFactor = 0.18;
    else if (vehicleType === "diesel_car") transportFactor = 0.19;
    else if (vehicleType === "cng_car") transportFactor = 0.12;
    else if (vehicleType === "two_wheeler") transportFactor = 0.08;
    else if (vehicleType === "ev_car") transportFactor = 0.15 * gridIntensity;

    totalCO2 += (mileage * 52 * transportFactor) / 1000;

    if (publicTransit === "low") totalCO2 += (30 * 52 * 0.04) / 1000;
    else if (publicTransit === "medium") totalCO2 += (100 * 52 * 0.04) / 1000;
    else if (publicTransit === "high") totalCO2 += (250 * 52 * 0.04) / 1000;

    if (diet === "heavy_meat") totalCO2 += 2.2;
    else if (diet === "balanced") totalCO2 += 1.6;
    else if (diet === "vegetarian") totalCO2 += 1.0;
    else if (diet === "vegan") totalCO2 += 0.6;

    let wasteCO2 = 0.35;
    if (composting) wasteCO2 -= 0.15;
    totalCO2 += wasteCO2;

    return parseFloat(totalCO2.toFixed(2));
  };

  const handleNext = () => {
    if (step === 1 && (!selectedState || !selectedCity)) {
      alert("Please enter your state and city.");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => setStep(step - 1);

  const handleComplete = async () => {
    const finalScore = calculateFootprint();
    const data = {
      transport: { type: vehicleType, mileage, fuelType: vehicleType },
      energy: { bill: electricityBill, lpgUsed: cookingFuel === "lpg" },
      food: { diet }
    };

    try {
      await updateCalculatorData(selectedState, selectedCity, data, finalScore);
    } catch (err) {
      console.error("Calculator submission failed:", err);
    }
  };

  return (
    <div className="glass-card animate-fade-in" style={{ maxWidth: "600px", width: "100%", padding: "40px", boxShadow: "var(--shadow-glass)", display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <h2 style={{ fontSize: "1.8rem" }} className="text-gradient">Carbon Calculator</h2>
        <span style={{ background: "var(--glass-bg)", padding: "4px 12px", borderRadius: "var(--radius-full)", fontSize: "0.85rem", fontWeight: "600", border: "1px solid var(--glass-border)" }}>
          Step {step} of 4
        </span>
      </div>

      <div style={{ width: "100%", height: "4px", background: "var(--glass-border)", borderRadius: "2px" }}>
        <div style={{ width: `${(step / 4) * 100}%`, height: "100%", background: "linear-gradient(90deg, var(--color-primary), var(--color-secondary))", borderRadius: "2px", transition: "width 0.3s ease" }} />
      </div>

      <div style={{ minHeight: "260px" }}>
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <MapPin size={24} />
              <h3 style={{ fontSize: "1.25rem" }}>Where are you located?</h3>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: "1.5" }}>
              Enter your location so the app can later attach it to live analytics and geocoding services.
            </p>

            <div className="form-group">
              <label className="form-label">State / Region</label>
              <select className="glass-input" value={selectedState} onChange={handleStateChange} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
                <option value="">Select your state</option>
                {INDIA_STATE_OPTIONS.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">City</label>
              <select className="glass-input" value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }} disabled={!selectedState}>
                <option value="">{selectedState ? "Select your city" : "Select a state first"}</option>
                {cityOptions.map((city) => <option key={city} value={city}>{city}</option>)}
              </select>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <Car size={24} />
              <h3 style={{ fontSize: "1.25rem" }}>Transit & Commutes</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Personal Vehicle</label>
              <select className="glass-input" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
                <option value="none">No vehicle (Walk / Cycle / Public Transit only)</option>
                <option value="petrol_car">Petrol Car</option>
                <option value="diesel_car">Diesel Car</option>
                <option value="cng_car">CNG Car</option>
                <option value="two_wheeler">Two-Wheeler (Scooter/Motorcycle)</option>
                <option value="ev_car">Electric Vehicle (EV)</option>
              </select>
            </div>
            {vehicleType !== "none" && (
              <div className="form-group">
                <label className="form-label">Average Weekly Mileage (in km)</label>
                <input type="number" className="glass-input" placeholder="e.g. 100" value={mileage || ""} onChange={(e) => setMileage(Math.max(0, parseInt(e.target.value) || 0))} style={{ width: "100%" }} />
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Public Transport Usage</label>
              <select className="glass-input" value={publicTransit} onChange={(e) => setPublicTransit(e.target.value)} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
                <option value="none">Never / Rarely</option>
                <option value="low">Low (Occasional trips / 30km week)</option>
                <option value="medium">Medium (Commute 3-4 times a week / 100km week)</option>
                <option value="high">High (Daily bus/metro / 250km week)</option>
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <Zap size={24} />
              <h3 style={{ fontSize: "1.25rem" }}>Household Utility & Energy</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Monthly Electricity Bill (in INR)</label>
              <input type="number" className="glass-input" placeholder="e.g. 1500" value={electricityBill || ""} onChange={(e) => setElectricityBill(Math.max(0, parseInt(e.target.value) || 0))} style={{ width: "100%" }} />
            </div>
            <div className="form-group">
              <label className="form-label">Primary Cooking Fuel</label>
              <select className="glass-input" value={cookingFuel} onChange={(e) => setCookingFuel(e.target.value)} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
                <option value="lpg">LPG Cylinder (Standard Liquid Gas)</option>
                <option value="png">PNG (Piped Natural Gas)</option>
                <option value="electric">Electric / Induction stove</option>
              </select>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }} className="animate-fade-in">
            <div style={{ display: "flex", gap: "10px", alignItems: "center", color: "var(--color-primary)" }}>
              <Apple size={24} />
              <h3 style={{ fontSize: "1.25rem" }}>Diet & Household Waste</h3>
            </div>
            <div className="form-group">
              <label className="form-label">Primary Diet Type</label>
              <select className="glass-input" value={diet} onChange={(e) => setDiet(e.target.value)} style={{ width: "100%", background: "hsl(222, 47%, 7%)" }}>
                <option value="heavy_meat">Meat-intensive (Includes red meat regularly)</option>
                <option value="balanced">Balanced (Mix of vegetables, dairy, occasional poultry/fish)</option>
                <option value="vegetarian">Vegetarian (No meat/fish, includes dairy)</option>
                <option value="vegan">Vegan (No animal products, plant-only)</option>
              </select>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "hsla(222, 47%, 7%, 0.6)", padding: "16px", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", marginTop: "10px" }}>
              <div>
                <div style={{ fontWeight: "500", fontSize: "0.95rem" }}>Do you compost kitchen waste?</div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Reduces organic material rotting in landfills.</div>
              </div>
              <input type="checkbox" checked={composting} onChange={(e) => setComposting(e.target.checked)} style={{ width: "22px", height: "22px", accentColor: "var(--color-primary)", cursor: "pointer" }} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "10px" }}>
        {step > 1 ? <button className="btn btn-secondary" onClick={handleBack}>Back</button> : <div />}
        {step < 4 ? <button className="btn btn-primary" onClick={handleNext}>Next Step</button> : <button className="btn btn-primary" onClick={handleComplete}>Complete & Enter City</button>}
      </div>
    </div>
  );
};
