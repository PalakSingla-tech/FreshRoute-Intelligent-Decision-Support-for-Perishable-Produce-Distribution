export type RiskLevel = "Low" | "Medium" | "High";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: GeoPoint;
}

// Synthetic demo locations for illustration only. They do not represent real businesses.
export const WAREHOUSES: Warehouse[] = [
  {
    id: "demo-hub-central",
    name: "Synthetic Demo Hub Central",
    location: { lat: 30.95, lng: 75.85 },
  },
  {
    id: "demo-hub-north",
    name: "Synthetic Demo Hub North",
    location: { lat: 31.62, lng: 74.9 },
  },
  {
    id: "demo-hub-south",
    name: "Synthetic Demo Hub South",
    location: { lat: 30.35, lng: 76.4 },
  },
];

export interface InventoryBatch {
  id: string;
  dbId?: number;
  commodity: string;
  emoji: string;
  quantityKg: number;
  packedAt: string;
  remainingHours: number;
  pricePerKg: number;
  recommendedAction: string;
  warehouseId: string;
}

export const SHELF_LIFE_SCALE_HOURS = 72;

export function riskFor(remainingHours: number): RiskLevel {
  if (remainingHours < 8) return "High";
  if (remainingHours <= 24) return "Medium";
  return "Low";
}

export const INVENTORY_BATCHES: InventoryBatch[] = [
  {
    id: "FP-1041",
    commodity: "Tomatoes",
    emoji: "🍅",
    quantityKg: 1200,
    packedAt: "2026-10-12T06:30:00+05:30",
    remainingHours: 5,
    pricePerKg: 28,
    recommendedAction: "Dispatch now to Ludhiana mandi",
    warehouseId: "demo-hub-central",
  },
  {
    id: "FP-1042",
    commodity: "Bananas",
    emoji: "🍌",
    quantityKg: 800,
    packedAt: "2026-10-11T18:00:00+05:30",
    remainingHours: 30,
    pricePerKg: 35,
    recommendedAction: "Hold for regular retail dispatch",
    warehouseId: "demo-hub-central",
  },
  {
    id: "FP-1043",
    commodity: "Onions",
    emoji: "🧅",
    quantityKg: 2400,
    packedAt: "2026-10-10T09:15:00+05:30",
    remainingHours: 16,
    pricePerKg: 32,
    recommendedAction: "Route to Amritsar wholesale market",
    warehouseId: "demo-hub-north",
  },
  {
    id: "FP-1044",
    commodity: "Spinach",
    emoji: "🥬",
    quantityKg: 350,
    packedAt: "2026-10-13T05:00:00+05:30",
    remainingHours: 7,
    pricePerKg: 22,
    recommendedAction: "Apply 25% discount and clear locally",
    warehouseId: "demo-hub-central",
  },
  {
    id: "FP-1045",
    commodity: "Potatoes",
    emoji: "🥔",
    quantityKg: 3000,
    packedAt: "2026-10-08T14:20:00+05:30",
    remainingHours: 60,
    pricePerKg: 24,
    recommendedAction: "Move to cold storage buffer",
    warehouseId: "demo-hub-south",
  },
  {
    id: "FP-1046",
    commodity: "Cauliflower",
    emoji: "🥦",
    quantityKg: 900,
    packedAt: "2026-10-12T11:45:00+05:30",
    remainingHours: 9,
    pricePerKg: 30,
    recommendedAction: "Bulk sale to institutional buyers",
    warehouseId: "demo-hub-south",
  },
  {
    id: "FP-1047",
    commodity: "Tomatoes",
    emoji: "🍅",
    quantityKg: 650,
    packedAt: "2026-10-12T20:10:00+05:30",
    remainingHours: 20,
    pricePerKg: 26,
    recommendedAction: "Prioritise Jalandhar retailers",
    warehouseId: "demo-hub-north",
  },
  {
    id: "FP-1048",
    commodity: "Methi Leaves",
    emoji: "🌿",
    quantityKg: 280,
    packedAt: "2026-10-13T01:40:00+05:30",
    remainingHours: 6,
    pricePerKg: 20,
    recommendedAction: "Divert to processing unit",
    warehouseId: "demo-hub-central",
  },
  {
    id: "FP-1049",
    commodity: "Bananas",
    emoji: "🍌",
    quantityKg: 1500,
    packedAt: "2026-10-09T07:00:00+05:30",
    remainingHours: 48,
    pricePerKg: 34,
    recommendedAction: "Schedule for Delhi NCR run",
    warehouseId: "demo-hub-south",
  },
  {
    id: "FP-1050",
    commodity: "Onions",
    emoji: "🧅",
    quantityKg: 1800,
    packedAt: "2026-10-07T16:30:00+05:30",
    remainingHours: 40,
    pricePerKg: 31,
    recommendedAction: "Hold in ventilated store",
    warehouseId: "demo-hub-north",
  },
  {
    id: "FP-1051",
    commodity: "Potatoes",
    emoji: "🥔",
    quantityKg: 2100,
    packedAt: "2026-10-11T10:00:00+05:30",
    remainingHours: 22,
    pricePerKg: 23,
    recommendedAction: "Sell to Kolkata cold chain partner",
    warehouseId: "demo-hub-central",
  },
  {
    id: "FP-1052",
    commodity: "Tomatoes",
    emoji: "🍅",
    quantityKg: 420,
    packedAt: "2026-10-13T03:15:00+05:30",
    remainingHours: 7,
    pricePerKg: 27,
    recommendedAction: "Apply 15% discount for same-day pickup",
    warehouseId: "demo-hub-south",
  },
];
