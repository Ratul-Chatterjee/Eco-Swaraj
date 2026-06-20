export type IndiaMapRegion = {
  pathIndex: number;
  name: string;
  aliases?: string[];
};

export const INDIA_MAP_REGIONS: IndiaMapRegion[] = [
  { pathIndex: 1, name: "Andaman and Nicobar Islands", aliases: ["Andaman & Nicobar Islands"] },
  { pathIndex: 2, name: "Andhra Pradesh" },
  { pathIndex: 3, name: "Arunachal Pradesh" },
  { pathIndex: 4, name: "Assam" },
  { pathIndex: 5, name: "Odisha" },
  { pathIndex: 6, name: "Himachal Pradesh" },
  { pathIndex: 7, name: "Telangana" },
  { pathIndex: 8, name: "Lakshadweep" },
  { pathIndex: 9, name: "Delhi (NCT)", aliases: ["Delhi"] },
  { pathIndex: 10, name: "Dadra and Nagar Haveli and Daman and Diu", aliases: ["Dadra & Nagar Haveli and Daman & Diu"] },
  { pathIndex: 11, name: "Puducherry" },
  { pathIndex: 12, name: "Gujarat" },
  { pathIndex: 13, name: "Ladakh" },
  { pathIndex: 14, name: "Punjab" },
  { pathIndex: 15, name: "West Bengal" },
  { pathIndex: 16, name: "Jammu & Kashmir", aliases: ["Jammu and Kashmir"] },
  { pathIndex: 17, name: "Kerala" },
  { pathIndex: 18, name: "Tamil Nadu" },
  { pathIndex: 19, name: "Goa" },
  { pathIndex: 20, name: "Rajasthan" },
  { pathIndex: 21, name: "Sikkim" },
  { pathIndex: 22, name: "Nagaland" },
  { pathIndex: 23, name: "Uttar Pradesh" },
  { pathIndex: 24, name: "Manipur" },
  { pathIndex: 25, name: "Mizoram" },
  { pathIndex: 26, name: "Karnataka" },
  { pathIndex: 27, name: "Chandigarh" },
  { pathIndex: 28, name: "Tripura" },
  { pathIndex: 29, name: "Madhya Pradesh" },
  { pathIndex: 30, name: "Jharkhand" },
  { pathIndex: 31, name: "Chhattisgarh" },
  { pathIndex: 32, name: "Maharashtra" },
  { pathIndex: 33, name: "Meghalaya" },
  { pathIndex: 34, name: "Bihar" },
  { pathIndex: 35, name: "Haryana" },
  { pathIndex: 36, name: "Uttarakhand" }
];

export const INDIA_REGION_LOOKUP = new Map<number, IndiaMapRegion>(INDIA_MAP_REGIONS.map((region) => [region.pathIndex, region]));

const normalizeRegionName = (value: string) => value.toLowerCase().replace(/[&/().,-]/g, " ").replace(/\s+/g, " ").trim();

export const buildIndiaRegionAliasLookup = () => {
  const lookup = new Map<string, string>();
  for (const region of INDIA_MAP_REGIONS) {
    lookup.set(normalizeRegionName(region.name), region.name);
    for (const alias of region.aliases ?? []) {
      lookup.set(normalizeRegionName(alias), region.name);
    }
  }
  return lookup;
};

export const normalizeIndiaRegionName = (name: string) => buildIndiaRegionAliasLookup().get(normalizeRegionName(name)) ?? name;
