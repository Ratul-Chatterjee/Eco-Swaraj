import { indiaStatesData } from "./indiaData";

export const INDIA_STATE_OPTIONS = indiaStatesData.map((state) => state.name);

export const getCitiesForState = (stateName: string) => {
  const state = indiaStatesData.find((entry) => entry.name === stateName);
  return state?.cities.map((city) => city.name) ?? [];
};
