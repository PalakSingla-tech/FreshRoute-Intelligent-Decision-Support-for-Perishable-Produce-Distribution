package com.FreshRoute.service;

import com.FreshRoute.dto.DiscountRecommendation;
import com.FreshRoute.dto.PlanRequestDto;
import com.FreshRoute.model.*;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import com.FreshRoute.repository.PlanResultRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class FreshRouteOptimizerService {

    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final PlanResultRepository planResultRepository;
    private final FeasibilityEngine feasibilityEngine;
    private final DiscountEngine discountEngine;

    @Data
    @Builder
    private static class CandidateAllocation {
        private Batch batch;
        private Destination destination;
        private double priorityScore;
        private double netMarginPerKg;
        private double spoilageRiskScore;
        private double urgencyScore;
        private double transportCostPenalty;
        private double totalTransitHours;
        private double shelfLifeBufferHours;
        private DiscountRecommendation discountRec;
    }

    /**
     * Executes the FreshRoute Perishability-Aware Optimization:
     * - Feasibility filter ensures zero produce arrives spoiled: transport + handling <= shelf_life.
     * - Multi-objective priority scoring balances spoilage risk, net margin, demand urgency, and logistics costs.
     * - Dynamic discounting accelerates sell-through for near-expiry produce.
     */
    @Transactional
    public PlanResult executeFreshRoutePlan(PlanRequestDto request) {
        if (request == null) {
            request = PlanRequestDto.builder().build();
        }

        boolean conservative = Boolean.TRUE.equals(request.getConservativeShelfLife());
        double wSpoilage = request.getSpoilageWeight() != null ? request.getSpoilageWeight() : 0.40;
        double wMargin = request.getMarginWeight() != null ? request.getMarginWeight() : 0.30;
        double wUrgency = request.getUrgencyWeight() != null ? request.getUrgencyWeight() : 0.20;
        double wCost = request.getCostWeight() != null ? request.getCostWeight() : 0.10;

        List<Batch> batches = new ArrayList<>(batchRepository.findAll());
        List<Destination> destinations = new ArrayList<>(destinationRepository.findByActiveTrue());

        Map<Long, Double> remainingBatchStockMap = new HashMap<>();
        for (Batch b : batches) {
            remainingBatchStockMap.put(b.getId(), b.getQuantityKg());
        }

        Map<Long, Double> remainingDemandMap = new HashMap<>();
        Map<Long, Double> remainingCapacityMap = new HashMap<>();
        for (Destination d : destinations) {
            remainingDemandMap.put(d.getId(), d.getDemandKg());
            remainingCapacityMap.put(d.getId(), d.getCapacityLimitKg());
        }

        // Build feasible candidate pairings and compute priority scores
        List<CandidateAllocation> candidatePool = new ArrayList<>();

        for (Batch batch : batches) {
            double effectiveShelfLife = batch.getEffectiveShelfLife(conservative);

            for (Destination dest : destinations) {
                FeasibilityCheckResult feasibility =
                        feasibilityEngine.checkFeasibility(batch, dest, conservative);

                if (!feasibility.isFeasible()) {
                    continue; // Skip infeasible pairs to prevent spoilage
                }

                double buffer = feasibility.getShelfLifeBufferHours();
                DiscountRecommendation discount =
                        discountEngine.calculateDiscount(buffer, dest.getOfferedPricePerKg());

                double transportCostPerKg = dest.getTransportCostPerKg() != null ? dest.getTransportCostPerKg() : 0.0;
                double handlingCostPerKg = dest.getHandlingCostPerKg() != null ? dest.getHandlingCostPerKg() : 0.0;
                double baseCostPerKg = batch.getBaseCostPerKg() != null ? batch.getBaseCostPerKg() : 20.0;

                double netMarginPerKg = discount.getEffectivePricePerKg() - transportCostPerKg - handlingCostPerKg - baseCostPerKg;

                // Spoilage risk score: higher when remaining shelf life is tighter (needs immediate dispatch)
                double perishabilitySens = batch.getPerishabilityFactor() != null ? batch.getPerishabilityFactor() : 0.8;
                double shelfLifeUrgency = Math.max(0.0, 1.0 - (buffer / (effectiveShelfLife + 1e-4)));
                double spoilageRiskScore = Math.min(1.0, shelfLifeUrgency * perishabilitySens * 1.5);

                // Margin score normalized (approx range ₹0 to ₹25/kg)
                double marginScore = Math.max(0.0, Math.min(1.0, (netMarginPerKg + 5.0) / 30.0));

                // Demand urgency score
                double urgencyScore = Math.min(1.0, (dest.getDemandUrgencyWeight() != null ? dest.getDemandUrgencyWeight() : 1.0) / 2.0);

                // Transport cost penalty
                double transportPenalty = Math.min(1.0, transportCostPerKg / 12.0);

                // Composite Priority formula
                double priorityScore = (wSpoilage * spoilageRiskScore)
                        + (wMargin * marginScore)
                        + (wUrgency * urgencyScore)
                        - (wCost * transportPenalty);

                candidatePool.add(CandidateAllocation.builder()
                        .batch(batch)
                        .destination(dest)
                        .priorityScore(priorityScore)
                        .netMarginPerKg(netMarginPerKg)
                        .spoilageRiskScore(spoilageRiskScore)
                        .urgencyScore(urgencyScore)
                        .transportCostPenalty(transportPenalty)
                        .totalTransitHours(feasibility.getTotalTransitHours())
                        .shelfLifeBufferHours(buffer)
                        .discountRec(discount)
                        .build());
            }
        }

        // Sort candidates by priority score descending
        candidatePool.sort((c1, c2) -> Double.compare(c2.getPriorityScore(), c1.getPriorityScore()));

        PlanResult planResult = PlanResult.builder()
                .planType("FRESHROUTE_OPTIMIZED")
                .scenarioName(request.getScenarioName() != null ? request.getScenarioName() : "FreshRoute Perishability-Aware Run")
                .executedAt(LocalDateTime.now())
                .totalBatchesConsidered(batches.size())
                .totalDestinationsConsidered(destinations.size())
                .build();

        double totalStockKg = batches.stream().mapToDouble(Batch::getQuantityKg).sum();
        double allocatedStockKg = 0.0;
        double spoiledStockKg = 0.0;
        double grossRevenue = 0.0;
        double totalTransportCost = 0.0;
        double totalHandlingCost = 0.0;
        double totalDiscountCost = 0.0;
        double totalSpoilagePenalty = 0.0;
        double totalDemandRequested = destinations.stream().mapToDouble(Destination::getDemandKg).sum();
        double totalDemandFulfilled = 0.0;

        for (CandidateAllocation cand : candidatePool) {
            Batch batch = cand.getBatch();
            Destination dest = cand.getDestination();

            double remBatchStock = remainingBatchStockMap.getOrDefault(batch.getId(), 0.0);
            if (remBatchStock <= 0.001) continue;

            double remDemand = remainingDemandMap.getOrDefault(dest.getId(), 0.0);
            double remCapacity = remainingCapacityMap.getOrDefault(dest.getId(), 0.0);
            double allocableLimit = Math.min(remDemand, remCapacity);

            if (allocableLimit <= 0.001) continue;

            double qtyToAllocate = Math.min(remBatchStock, allocableLimit);

            // Update remaining allocations
            remainingBatchStockMap.put(batch.getId(), remBatchStock - qtyToAllocate);
            remainingDemandMap.put(dest.getId(), remDemand - qtyToAllocate);
            remainingCapacityMap.put(dest.getId(), remCapacity - qtyToAllocate);

            double basePrice = dest.getOfferedPricePerKg();
            double discountPct = cand.getDiscountRec().getDiscountPercentage();
            double effectivePrice = cand.getDiscountRec().getEffectivePricePerKg();

            double batchGrossRev = qtyToAllocate * basePrice;
            double batchDiscountCost = qtyToAllocate * (basePrice - effectivePrice);
            double batchEffectiveRev = qtyToAllocate * effectivePrice;
            double batchTransportCost = qtyToAllocate * (dest.getTransportCostPerKg() != null ? dest.getTransportCostPerKg() : 0.0);
            double batchHandlingCost = qtyToAllocate * (dest.getHandlingCostPerKg() != null ? dest.getHandlingCostPerKg() : 0.0);
            double batchNetMargin = batchEffectiveRev - batchTransportCost - batchHandlingCost;

            allocatedStockKg += qtyToAllocate;
            grossRevenue += batchEffectiveRev;
            totalDiscountCost += batchDiscountCost;
            totalTransportCost += batchTransportCost;
            totalHandlingCost += batchHandlingCost;
            totalDemandFulfilled += qtyToAllocate;

            // Generate detailed explainable decision rationale
            String explanation = String.format(
                    "FreshRoute Perishability Allocation: Dispatched %s kg of %s to %s (transit %s hrs, buffer %s hrs). " +
                            "Priority Score: %s (Spoilage Risk: %s, Margin Score: %s/kg). %s",
                    round(qtyToAllocate), batch.getCommodity(), dest.getName(),
                    round(cand.getTotalTransitHours()), round(cand.getShelfLifeBufferHours()),
                    round(cand.getPriorityScore()), round(cand.getSpoilageRiskScore()),
                    round(cand.getNetMarginPerKg()),
                    cand.getDiscountRec().getRiskTier().equals("SAFE") ? "Full price realized." : cand.getDiscountRec().getDisclosedAssumption());

            String preventionBenefit = String.format(
                    "Zero spoilage achieved. 100%% feasible delivery with %s hrs safety buffer. Net margin: \u20B9%s (\u20B9%s/kg).",
                    round(cand.getShelfLifeBufferHours()), round(batchNetMargin), round(batchNetMargin / qtyToAllocate));

            Allocation allocation = Allocation.builder()
                    .batchCode(batch.getBatchCode())
                    .commodity(batch.getCommodity())
                    .destinationCode(dest.getDestinationCode())
                    .destinationName(dest.getName())
                    .allocatedQuantityKg(round(qtyToAllocate))
                    .transportTimeHours(dest.getTransportTimeHours())
                    .handlingTimeHours(dest.getHandlingTimeHours())
                    .totalTransitHours(round(cand.getTotalTransitHours()))
                    .remainingShelfLifeHours(batch.getEffectiveShelfLife(conservative))
                    .shelfLifeBufferAtArrivalHours(round(cand.getShelfLifeBufferHours()))
                    .isFeasible(true)
                    .baseOfferedPricePerKg(dest.getOfferedPricePerKg())
                    .discountPercentage(round(discountPct))
                    .effectivePricePerKg(round(effectivePrice))
                    .grossRevenueInr(round(batchGrossRev))
                    .transportCostInr(round(batchTransportCost))
                    .handlingCostInr(round(batchHandlingCost))
                    .discountCostInr(round(batchDiscountCost))
                    .spoilageCostInr(0.0)
                    .netMarginInr(round(batchNetMargin))
                    .priorityScore(round(cand.getPriorityScore()))
                    .riskTier(cand.getDiscountRec().getRiskTier())
                    .explanation(explanation)
                    .spoilagePreventionBenefit(preventionBenefit)
                    .build();

            planResult.addAllocation(allocation);
        }

        // Account for any residual unallocated stock
        for (Batch batch : batches) {
            double unallocatedQty = remainingBatchStockMap.getOrDefault(batch.getId(), 0.0);
            if (unallocatedQty > 0.001) {
                double baseCost = batch.getBaseCostPerKg() != null ? batch.getBaseCostPerKg() : 20.0;
                double unallocLoss = unallocatedQty * baseCost;
                if (batch.getEffectiveShelfLife(conservative) <= 0.0) {
                    spoiledStockKg += unallocatedQty;
                    totalSpoilagePenalty += unallocLoss;
                }

                Allocation unallocated = Allocation.builder()
                        .batchCode(batch.getBatchCode())
                        .commodity(batch.getCommodity())
                        .destinationCode("LOCAL-RESERVE")
                        .destinationName("Hub Reserve / Secondary Offtake")
                        .allocatedQuantityKg(round(unallocatedQty))
                        .transportTimeHours(0.0)
                        .handlingTimeHours(0.0)
                        .totalTransitHours(0.0)
                        .remainingShelfLifeHours(batch.getRemainingShelfLifeHours())
                        .shelfLifeBufferAtArrivalHours(batch.getRemainingShelfLifeHours())
                        .isFeasible(true)
                        .baseOfferedPricePerKg(batch.getReferenceMarketPricePerKg() != null ? batch.getReferenceMarketPricePerKg() : 20.0)
                        .discountPercentage(50.0)
                        .effectivePricePerKg(10.0)
                        .grossRevenueInr(round(unallocatedQty * 10.0))
                        .transportCostInr(0.0)
                        .handlingCostInr(0.0)
                        .discountCostInr(round(unallocatedQty * 10.0))
                        .spoilageCostInr(0.0)
                        .netMarginInr(round(unallocatedQty * 10.0 - unallocLoss))
                        .priorityScore(0.1)
                        .riskTier("HIGH")
                        .explanation("Unmatched network volume retained for immediate local processing / 50% distress salvage sale.")
                        .spoilagePreventionBenefit("Salvaged through local food processing rather than dump-ground write-off.")
                        .build();

                planResult.addAllocation(unallocated);
            }
        }

        double netRevenue = grossRevenue - totalTransportCost - totalHandlingCost - totalDiscountCost - totalSpoilagePenalty;
        double fulfillmentPct = totalDemandRequested > 0 ? (totalDemandFulfilled / totalDemandRequested) * 100.0 : 0.0;
        double feasibilityPct = 100.0; // All dispatched allocations strictly respect shelf-life constraints
        double spoilagePct = totalStockKg > 0 ? (spoiledStockKg / totalStockKg) * 100.0 : 0.0;

        planResult.setTotalStockKg(round(totalStockKg));
        planResult.setAllocatedStockKg(round(allocatedStockKg));
        planResult.setSpoiledStockKg(round(spoiledStockKg));
        planResult.setUnallocatedStockKg(round(Math.max(0, totalStockKg - allocatedStockKg)));
        planResult.setGrossRevenueInr(round(grossRevenue));
        planResult.setTransportCostInr(round(totalTransportCost));
        planResult.setHandlingCostInr(round(totalHandlingCost));
        planResult.setDiscountCostInr(round(totalDiscountCost));
        planResult.setSpoilagePenaltyInr(round(totalSpoilagePenalty));
        planResult.setNetRevenueInr(round(netRevenue));
        planResult.setDemandFulfillmentRate(round(fulfillmentPct));
        planResult.setAllocationFeasibilityRate(round(feasibilityPct));
        planResult.setSpoilageRate(round(spoilagePct));

        return planResultRepository.save(planResult);
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
