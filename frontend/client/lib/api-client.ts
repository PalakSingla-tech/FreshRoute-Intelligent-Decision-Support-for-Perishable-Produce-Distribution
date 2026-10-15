/**
 * FreshRoute Central API Client
 * Proxied directly to Spring Boot backend running on port 8082
 */

export interface BackendBatch {
  id: number;
  batchCode: string;
  commodity: string;
  originLocation: string;
  quantityKg: number;
  remainingShelfLifeHours: number;
  shelfLifeMinHours: number;
  shelfLifeMaxHours: number;
  baseCostPerKg: number;
  referenceMarketPricePerKg: number;
  storageCondition: string;
  storageTempC: number;
  perishabilityFactor: number;
  harvestTimestamp: string;
  notes: string;
  warehouseId: string;
  emoji: string;
  recommendedAction: string;
  respirationRate?: string;
  optimumTemp?: string;
  packedAt?: string;
}

export interface CandidateRoute {
  destinationCode: string;
  destinationName: string;
  offeredPricePerKg: number;
  totalTransitHours: number;
  shelfLifeBufferHours: number;
  feasibilityVerdict: string;
  recommendedDiscountPercentage: number;
  projectedNetMarginPerKg: number;
  decisionComment: string;
  feasible: boolean;
}

export interface BatchDecisionAudit {
  batchCode: string;
  commodity: string;
  emoji: string;
  warehouseId: string;
  quantityKg: number;
  remainingShelfLifeHours: number;
  riskLevel: string;
  urgencyTier: string;
  recommendedAction: string;
  spoilageProbability: string;
  respirationRate: string;
  corridorHeatFactor: string;
  q10Factor: string;
  optimumTemp: string;
  degradationThreshold: string;
  transitBuffer: string;
  basePricePerKg: number;
  markdownPct: number;
  effectivePricePerKg: number;
  salvageValueInr: number;
  potentialLossInr: number;
  candidateRoutes: CandidateRoute[];
  finalRecommendationRationale: string;
  baselineBlindSpotExplanation: string;
  pricingAndDiscountRuleDisclosed: string;
}

export interface BackendAllocation {
  id: number;
  batchCode: string;
  commodity: string;
  destinationCode: string;
  destinationName: string;
  allocatedQuantityKg: number;
  transportTimeHours: number;
  handlingTimeHours: number;
  totalTransitHours: number;
  remainingShelfLifeHours: number;
  shelfLifeBufferAtArrivalHours: number;
  isFeasible: boolean;
  infeasibilityReason: string;
  baseOfferedPricePerKg: number;
  discountPercentage: number;
  effectivePricePerKg: number;
  grossRevenueInr: number;
  transportCostInr: number;
  handlingCostInr: number;
  discountCostInr: number;
  spoilageCostInr: number;
  netMarginInr: number;
  priorityScore: number;
  riskTier: string;
  explanation: string;
  spoilagePreventionBenefit: string;
}

export interface BackendPlanResult {
  id: number;
  planType: "BASELINE_FIFO" | "FRESHROUTE_OPTIMIZED";
  scenarioName: string;
  executedAt: string;
  totalBatchesConsidered: number;
  totalDestinationsConsidered: number;
  totalStockKg: number;
  allocatedStockKg: number;
  spoiledStockKg: number;
  unallocatedStockKg: number;
  grossRevenueInr: number;
  transportCostInr: number;
  handlingCostInr: number;
  discountCostInr: number;
  spoilagePenaltyInr: number;
  netRevenueInr: number;
  demandFulfillmentRate: number;
  allocationFeasibilityRate: number;
  spoilageRate: number;
  allocations: BackendAllocation[];
}

export interface PlanComparisonResponse {
  baseline: BackendPlanResult;
  freshRoute: BackendPlanResult;
  spoilageReductionKg: number;
  spoilageReductionPercentage: number;
  spoilageValueSavedInr: number;
  demandFulfillmentGainPercentage: number;
  netRevenueGainInr: number;
  netRevenueGainPercentage: number;
  feasibilityGainPercentage: number;
  summaryVerdict: string;
  executiveInsights: string;
}

export interface BackendDiscountRecommendation {
  batchId: number;
  batchCode: string;
  commodity: string;
  riskTier: string;
  currentShelfLifeHours: number;
  unallocatedKg: number;
  recommendedAction: string;
  suggestedDiscountPercentage: number;
  originalPricePerKg: number;
  discountedPricePerKg: number;
  assumedSellableKg: number;
  potentialSalvagedRevenueInr: number;
  salvageDestinationName: string;
  rationale: string;
}

export interface BackendDiscountSummary {
  atRiskUnallocatedKg: number;
  discountedBatchCount: number;
  planDiscountedRevenueInr: number;
  potentialClearanceRevenueInr: number;
}

export interface BackendDiscountResult {
  recommendations: BackendDiscountRecommendation[];
  summary: BackendDiscountSummary;
}

export interface BackendManifestAllocation {
  id?: number;
  batchCode: string;
  commodity: string;
  emoji?: string;
  destinationCode?: string;
  destinationName: string;
  allocatedQuantityKg: number;
  transportTimeHours?: number;
  handlingTimeHours?: number;
  totalTransitHours?: number;
  remainingShelfLifeHours: number;
  shelfLifeBufferAtArrivalHours?: number;
  shelfLifeBufferHours?: number;
  isFeasible: boolean;
  baseOfferedPricePerKg?: number;
  discountPercentage: number;
  effectivePricePerKg: number;
  grossRevenueInr?: number;
  netMarginInr?: number;
  explanation?: string;
}

export interface BackendManifest {
  manifestNumber: string;
  issuedAt?: string;
  authorizationStatus: string;
  dispatchWindow?: string;
  validityWindow?: string;
  fleetVehicle?: string;
  fleetVehicleId?: string;
  coldChainReefer?: string;
  coldChainReeferTempC?: number;
  originPackhouse: string;
  primaryTarget?: string;
  primaryTargetMandi?: string;
  totalDispatchWeightKg?: number;
  totalWeightKg?: number;
  estimatedGrossValueInr?: number;
  totalAuthorizedBatchesCount?: number;
  demandFulfillmentRate?: number;
  driverAuthorizationNotice?: string;
  qrCodePayload?: string;
  certifiedOfficer?: string;
  allocations?: BackendManifestAllocation[];
  batches?: BackendManifestAllocation[];
  authorizedBatches?: BackendManifestAllocation[];
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(endpoint, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`API error ${response.status} on ${endpoint}: ${errorText || response.statusText}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  if (!text || !text.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

export const api = {
  // Inventory CRUD
  getInventory: () => request<BackendBatch[]>("/api/inventory"),
  getBatch: (codeOrId: string) => request<BackendBatch>(`/api/inventory/${codeOrId}`),
  createBatch: (batch: Partial<BackendBatch>) =>
    request<BackendBatch>("/api/inventory", {
      method: "POST",
      body: JSON.stringify(batch),
    }),
  updateBatch: (id: number | string, batch: Partial<BackendBatch>) =>
    request<BackendBatch>(`/api/inventory/${id}`, {
      method: "PUT",
      body: JSON.stringify(batch),
    }),
  deleteBatch: (id: number | string) =>
    request<void>(`/api/inventory/${id}`, {
      method: "DELETE",
    }),
  resetInventory: () =>
    request<string>("/api/inventory/reset", {
      method: "POST",
    }),

  // Explainability
  getBatchExplainability: (batchCode: string) =>
    request<BatchDecisionAudit>(`/api/explain/batch/${batchCode}`),

  // Plan Execution & Comparison
  getPlanComparison: () => request<PlanComparisonResponse>("/api/plan/compare"),
  runFreshRoutePlan: (data?: any) =>
    request<BackendPlanResult>("/api/plan/freshroute", {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),
  runBaselinePlan: (data?: any) =>
    request<BackendPlanResult>("/api/plan/baseline", {
      method: "POST",
      body: JSON.stringify(data ?? {}),
    }),

  // Analytics
  getExecutiveDashboard: () => request<any>("/api/analytics/dashboard"),

  // Discounts
  getDiscounts: () => request<BackendDiscountResult>("/api/discounts/recommendations"),
  getDiscountRules: () => request<any>("/api/discounts/rules"),

  // Reports & Manifest
  getReportEvaluation: () => request<any>("/api/reports/evaluation"),
  getConstraintAudit: () => request<any>("/api/reports/constraint-audit"),
  getManifest: () => request<BackendManifest>("/api/reports/manifest"),

  // Network & Routes
  getWarehouses: () => request<any>("/api/network/warehouses"),
  getRoutes: () => request<any>("/api/network/routes"),
  getDestinationStats: () => request<any>("/api/network/destination-stats"),

  // Scenarios
  simulateScenario: (scenarioData: any) =>
    request<any>("/api/scenarios/simulate", {
      method: "POST",
      body: JSON.stringify(scenarioData),
    }),
  replanScenario: (replanData?: any) =>
    request<PlanComparisonResponse>("/api/scenarios/replan", {
      method: "POST",
      body: JSON.stringify(replanData ?? {}),
    }),
  resetScenario: () =>
    request<any>("/api/scenarios/reset", {
      method: "POST",
    }),
};

export function toInventoryBatch(b: BackendBatch): import("./inventory-batches").InventoryBatch {
  return {
    id: b.batchCode || `FP-${b.id}`,
    dbId: b.id,
    commodity: b.commodity,
    emoji: b.emoji || "📦",
    quantityKg: b.quantityKg,
    packedAt: b.packedAt || b.harvestTimestamp || new Date().toISOString(),
    remainingHours: b.remainingShelfLifeHours ?? 24,
    pricePerKg: b.referenceMarketPricePerKg || b.baseCostPerKg || 25,
    recommendedAction: b.recommendedAction || "Hold in buffer",
    warehouseId: b.warehouseId || "demo-hub-central",
  };
}

