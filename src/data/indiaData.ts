export interface CityInfo {
  name: string;
  lat: number;
  lng: number;
  avgPerCapitaCO2: number; // in tonnes per year
}

export interface StateInfo {
  name: string;
  avgPerCapitaCO2: number; // in tonnes per year
  gridIntensity: number;   // kg CO2 per kWh
  cities: CityInfo[];
}

export const indiaStatesData: StateInfo[] = [
  {
    name: "Maharashtra",
    avgPerCapitaCO2: 2.0,
    gridIntensity: 0.79,
    cities: [
      { name: "Mumbai", lat: 19.0760, lng: 72.8777, avgPerCapitaCO2: 2.2 },
      { name: "Pune", lat: 18.5204, lng: 73.8567, avgPerCapitaCO2: 1.9 },
      { name: "Nagpur", lat: 21.1458, lng: 79.0882, avgPerCapitaCO2: 1.8 },
      { name: "Thane", lat: 19.2183, lng: 72.9781, avgPerCapitaCO2: 2.0 }
    ]
  },
  {
    name: "Delhi (NCT)",
    avgPerCapitaCO2: 2.8,
    gridIntensity: 0.75,
    cities: [
      { name: "New Delhi", lat: 28.6139, lng: 77.2090, avgPerCapitaCO2: 2.8 },
      { name: "Dwarka", lat: 28.5823, lng: 77.0500, avgPerCapitaCO2: 2.6 }
    ]
  },
  {
    name: "Karnataka",
    avgPerCapitaCO2: 1.5,
    gridIntensity: 0.55,
    cities: [
      { name: "Bengaluru", lat: 12.9716, lng: 77.5946, avgPerCapitaCO2: 1.6 },
      { name: "Mysuru", lat: 12.2958, lng: 76.6394, avgPerCapitaCO2: 1.2 },
      { name: "Hubballi-Dharwad", lat: 15.3647, lng: 75.1240, avgPerCapitaCO2: 1.1 }
    ]
  },
  {
    name: "Gujarat",
    avgPerCapitaCO2: 2.5,
    gridIntensity: 0.82,
    cities: [
      { name: "Ahmedabad", lat: 23.0225, lng: 72.5714, avgPerCapitaCO2: 2.4 },
      { name: "Surat", lat: 21.1702, lng: 72.8311, avgPerCapitaCO2: 2.6 },
      { name: "Vadodara", lat: 22.3072, lng: 73.1812, avgPerCapitaCO2: 2.2 },
      { name: "Rajkot", lat: 22.3039, lng: 70.8022, avgPerCapitaCO2: 1.9 }
    ]
  },
  {
    name: "Tamil Nadu",
    avgPerCapitaCO2: 1.7,
    gridIntensity: 0.60,
    cities: [
      { name: "Chennai", lat: 13.0827, lng: 80.2707, avgPerCapitaCO2: 2.1 },
      { name: "Coimbatore", lat: 11.0168, lng: 76.9558, avgPerCapitaCO2: 1.5 },
      { name: "Madurai", lat: 9.9252, lng: 78.1198, avgPerCapitaCO2: 1.3 }
    ]
  },
  {
    name: "West Bengal",
    avgPerCapitaCO2: 1.8,
    gridIntensity: 0.78,
    cities: [
      { name: "Kolkata", lat: 22.5726, lng: 88.3639, avgPerCapitaCO2: 2.0 },
      { name: "Howrah", lat: 22.5780, lng: 88.3181, avgPerCapitaCO2: 1.7 },
      { name: "Asansol", lat: 23.6740, lng: 86.9520, avgPerCapitaCO2: 2.3 }
    ]
  },
  {
    name: "Telangana",
    avgPerCapitaCO2: 1.6,
    gridIntensity: 0.70,
    cities: [
      { name: "Hyderabad", lat: 17.3850, lng: 78.4867, avgPerCapitaCO2: 1.8 },
      { name: "Warangal", lat: 17.9689, lng: 79.5941, avgPerCapitaCO2: 1.2 }
    ]
  },
  {
    name: "Uttar Pradesh",
    avgPerCapitaCO2: 1.2,
    gridIntensity: 0.78,
    cities: [
      { name: "Lucknow", lat: 26.8467, lng: 80.9462, avgPerCapitaCO2: 1.1 },
      { name: "Kanpur", lat: 26.4499, lng: 80.3319, avgPerCapitaCO2: 1.3 },
      { name: "Noida", lat: 28.5355, lng: 77.3910, avgPerCapitaCO2: 1.9 },
      { name: "Ghaziabad", lat: 28.6692, lng: 77.4538, avgPerCapitaCO2: 1.8 },
      { name: "Varanasi", lat: 25.3176, lng: 82.9739, avgPerCapitaCO2: 0.9 }
    ]
  },
  {
    name: "Kerala",
    avgPerCapitaCO2: 1.0,
    gridIntensity: 0.40,
    cities: [
      { name: "Kochi", lat: 9.9312, lng: 76.2673, avgPerCapitaCO2: 1.2 },
      { name: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366, avgPerCapitaCO2: 0.9 },
      { name: "Kozhikode", lat: 11.2588, lng: 75.7804, avgPerCapitaCO2: 0.8 }
    ]
  },
  {
    name: "Odisha",
    avgPerCapitaCO2: 2.2,
    gridIntensity: 0.85,
    cities: [
      { name: "Bhubaneswar", lat: 20.2961, lng: 85.8245, avgPerCapitaCO2: 1.7 },
      { name: "Cuttack", lat: 20.4625, lng: 85.8830, avgPerCapitaCO2: 1.5 },
      { name: "Rourkela", lat: 22.2604, lng: 84.8536, avgPerCapitaCO2: 3.2 } // Industrial hub
    ]
  },
  {
    name: "Rajasthan",
    avgPerCapitaCO2: 1.4,
    gridIntensity: 0.68,
    cities: [
      { name: "Jaipur", lat: 26.9124, lng: 75.7873, avgPerCapitaCO2: 1.5 },
      { name: "Jodhpur", lat: 26.2389, lng: 73.0243, avgPerCapitaCO2: 1.3 },
      { name: "Kota", lat: 25.2138, lng: 75.8648, avgPerCapitaCO2: 1.6 }
    ]
  },
  {
    name: "Haryana",
    avgPerCapitaCO2: 1.9,
    gridIntensity: 0.78,
    cities: [
      { name: "Gurugram", lat: 28.4595, lng: 77.0266, avgPerCapitaCO2: 2.6 },
      { name: "Faridabad", lat: 28.4089, lng: 77.3178, avgPerCapitaCO2: 2.1 }
    ]
  },
  {
    name: "Punjab",
    avgPerCapitaCO2: 1.8,
    gridIntensity: 0.70,
    cities: [
      { name: "Ludhiana", lat: 30.9010, lng: 75.8573, avgPerCapitaCO2: 2.1 },
      { name: "Amritsar", lat: 31.6340, lng: 74.8723, avgPerCapitaCO2: 1.5 }
    ]
  },
  {
    name: "Madhya Pradesh",
    avgPerCapitaCO2: 1.5,
    gridIntensity: 0.75,
    cities: [
      { name: "Bhopal", lat: 23.2599, lng: 77.4126, avgPerCapitaCO2: 1.3 },
      { name: "Indore", lat: 22.7196, lng: 75.8577, avgPerCapitaCO2: 1.6 },
      { name: "Gwalior", lat: 26.2183, lng: 78.1828, avgPerCapitaCO2: 1.2 }
    ]
  },
  {
    name: "Bihar",
    avgPerCapitaCO2: 0.6,
    gridIntensity: 0.78,
    cities: [
      { name: "Patna", lat: 25.5941, lng: 85.1376, avgPerCapitaCO2: 0.8 },
      { name: "Gaya", lat: 24.7914, lng: 84.9997, avgPerCapitaCO2: 0.5 }
    ]
  },
  {
    name: "Assam",
    avgPerCapitaCO2: 0.8,
    gridIntensity: 0.60,
    cities: [
      { name: "Guwahati", lat: 26.1445, lng: 91.7362, avgPerCapitaCO2: 1.0 },
      { name: "Dibrugarh", lat: 27.4728, lng: 94.9120, avgPerCapitaCO2: 0.7 }
    ]
  }
];

export const nationalAverage = 1.8; // tonnes CO2 per capita per year in India
