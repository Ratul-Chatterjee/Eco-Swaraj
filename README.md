# Eco-Swaraj | Interactive Indian Carbon Footprint Tracker & Gamified Solar City

Eco-Swaraj is a premium, interactive web application designed to help individuals in India calculate, track, and reduce their carbon footprints through simple actions and personalized insights. The application gamifies sustainability by allowing users to build and upgrade their own 2D isometric digital eco-city using "Carbon Coins" earned by logging real-world green actions.

---

## ?? Chosen Challenge Vertical
* **Vertical:** Challenge 3 - Carbon Footprint Awareness Platform
* **Goal:** Design a solution that helps individuals understand, track, and reduce their carbon footprint through simple actions and personalized insights.

---

## ??? Tech Stack & Architecture

* **Frontend:** React + Vite + TypeScript (ultra-fast, typed, lightweight)
* **Styling:** Custom Vanilla CSS (glassmorphism panels, responsive HSL-tailored color themes, smooth micro-animations, Inter/Outfit typography, zero Tailwind footprint)
* **Authentication:** Firebase Auth (Secure Google Sign-In & Email Passwordless verification flow)
* **Database:** Firebase Firestore (for syncing city layout & carbon metrics per account)
* **Security Rules:** Strict client-ownership checks written in `firestore.rules` (only authenticated users can read/write their own nodes).
* **Third-Party APIs:**
  * **Open-Meteo Air Quality API:** Keyless real-time pollutant rates (PM2.5, PM10, CO, NO2, O3) mapped to coordinates.
  * **Carbon analytics pipeline:** A backend/scheduled job writes normalized live carbon analytics into Firestore, so the app can consume live data without checking secrets into the repo.

---

## ?? How the Solution Works

### 1. Onboarding Carbon Calculator
* **Location Mapping:** Users select their Indian State and City. This geolocates their coordinates (for air quality calls) and matches their electricity usage to their specific state's power grid emission factor.
* **Multi-Step Calculation:** Estimates annual footprint (tonnes CO2e) covering:
  * *Energy:* Electricity bill divided by avg tariff multiplied by grid intensity. Cooking fuel type (LPG vs PNG).
  * *Transport:* Vehicles mileage (Petrol, Diesel, CNG, EV) and weekly public transit frequency.
  * *Diet & Waste:* Diet carbon footprints (Heavy Meat, Balanced, Vegetarian, Vegan) and household composting offsets.

### 2. Interactive 2D Isometric City Builder ("Eco-Village")
* **Interactive Canvas:** An optimized HTML5 Canvas rendering a 2D isometric grid.
* **Earn & Place:** Earn "Carbon Coins" by completing real-world tasks. Spend coins in the Green Shop to place structures.
* **Building Upgrades:** Clicking buildings opens an inspector panel allowing users to upgrade structures by spending coins.

### 3. Daily Activity Tracker
* Log daily actions and reduce CO2 instantly, increase experience levels, and add coins to your balance.

### 4. Real-Time India Air Quality Insights
* Automatically fetches real-time PM2.5, PM10, CO, NO2, and Ozone levels using city coordinates.
* Classifies AQI and gives suggestions based on pollution levels.

---

## ?? Security & Deployment Notes

This project is prepared for public GitHub hosting with no checked-in secret files.

### What is intentionally excluded from GitHub
* `.env`
* `.env.local`
* `.env.*`
* nested env files inside subfolders
* other common credential artifacts like `*.pem`, `*.key`, and similar files

### Where secrets should live
* Local development: your machine only, in ignored env files
* Vercel deployment: Project Settings ? Environment Variables
* Firebase backend config: managed in Firebase / Functions environment setup, not committed to the repo

*Note: I am not creating an `.env.example` file because you asked not to add one unless it is truly needed. The project already works without it; the tradeoff is that new setup must be done from the README or deployment notes instead of a template file.*

---

## ?? Assumptions & Mathematical Models

1. **Electricity Conversion:** Monthly bill is translated to kWh using an estimated average consumer tariff of **?7.00 per kWh** in India.
2. **Vehicle Emissions Factors:**
   * Petrol Car: `0.18 kg CO2/km`
   * Diesel Car: `0.19 kg CO2/km`
   * CNG Car: `0.12 kg CO2/km`
   * Two-wheeler: `0.08 kg CO2/km`
   * Electric Vehicle: `0.15 kWh/km * local grid factor`
3. **Composting Offset:** Composting organic waste is assumed to offset **0.15 tonnes CO2e/year** by avoiding landfill methane generation.
4. **National Average:** National per-capita emission baseline in India is set to **1.8 tonnes CO2e/year** based on standard energy and sector statistics.
