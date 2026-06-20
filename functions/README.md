# Firebase Functions skeleton for Eco-Swaraj

This folder contains the scheduled backend job that fetches live carbon analytics from your upstream source and writes the normalized result to Firestore.

## Expected env vars

- `CARBON_ANALYTICS_SOURCE_URL`
- `CARBON_ANALYTICS_SOURCE_KEY` (optional)

## Flow

1. `syncIndiaCarbonAnalytics` runs on a schedule.
2. It fetches the upstream analytics payload.
3. It normalizes the payload to the shared contract.
4. It writes the result to `publicAnalytics/indiaCarbon`.
5. The frontend subscribes to Firestore and updates in real time.
