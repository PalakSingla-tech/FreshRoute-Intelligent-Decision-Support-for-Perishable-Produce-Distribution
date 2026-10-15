export interface DispatchLane {
  id: string;
  batchId: string;
  commodity: string;
  emoji: string;
  quantityKg: number;
  route: string;
  vehicle: string;
  departure: string;
  status: "Loading" | "Scheduled" | "In transit";
}

export const DISPATCH_LANES: DispatchLane[] = [
  {
    id: "DL-301",
    batchId: "FP-1041",
    commodity: "Tomatoes",
    emoji: "🍅",
    quantityKg: 1200,
    route: "Khanna Hub → Ludhiana Mandi",
    vehicle: "Reefer TRK-14",
    departure: "6:30 AM",
    status: "Loading",
  },
  {
    id: "DL-302",
    batchId: "FP-1048",
    commodity: "Methi Leaves",
    emoji: "🌿",
    quantityKg: 280,
    route: "Ludhiana Hub → Processing Unit",
    vehicle: "Van KA-09",
    departure: "7:15 AM",
    status: "Scheduled",
  },
  {
    id: "DL-303",
    batchId: "FP-1044",
    commodity: "Spinach",
    emoji: "🥬",
    quantityKg: 350,
    route: "Jalandhar Hub → Local Retail",
    vehicle: "Van PB-22",
    departure: "8:00 AM",
    status: "Scheduled",
  },
  {
    id: "DL-304",
    batchId: "FP-1043",
    commodity: "Onions",
    emoji: "🧅",
    quantityKg: 2400,
    route: "Khanna Hub → Amritsar Wholesale",
    vehicle: "Truck PB-47",
    departure: "9:30 AM",
    status: "In transit",
  },
  {
    id: "DL-305",
    batchId: "FP-1046",
    commodity: "Cauliflower",
    emoji: "🥦",
    quantityKg: 900,
    route: "Patiala Hub → Institutional Buyers",
    vehicle: "Reefer TRK-03",
    departure: "10:10 AM",
    status: "Scheduled",
  },
  {
    id: "DL-306",
    batchId: "FP-1052",
    commodity: "Tomatoes",
    emoji: "🍅",
    quantityKg: 420,
    route: "Ludhiana Hub → Same-day Pickup",
    vehicle: "Van KA-16",
    departure: "11:00 AM",
    status: "Scheduled",
  },
  {
    id: "DL-307",
    batchId: "FP-1051",
    commodity: "Potatoes",
    emoji: "🥔",
    quantityKg: 2100,
    route: "Khanna Hub → Kolkata Cold Chain",
    vehicle: "Reefer TRK-21",
    departure: "1:45 PM",
    status: "Scheduled",
  },
];
