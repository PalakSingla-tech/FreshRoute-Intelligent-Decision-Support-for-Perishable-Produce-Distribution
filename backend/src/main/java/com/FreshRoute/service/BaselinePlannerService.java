package com.FreshRoute.service;

import com.FreshRoute.model.Allocation;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import com.FreshRoute.repository.PlanResultRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class BaselinePlannerService {

    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final PlanResultRepository planResultRepository;
    private final FeasibilityEngine feasibilityEngine;

    /**
     * Executes the baseline FIFO strategy:
     * - Batches dispatched strictly in FIFO order (by harvest date / batch code).
     * - Dispatched greedily to the highest-price destination with remaining capacity/demand.
     * - Ignores perishability risk and shelf-life feasibility, resulting in severe transit spoilage!
     */
    @Transactional
    public PlanResult executeBaselinePlan(String scenarioName) {
        List<Batch> batches = new ArrayList<>(batchRepository.findAll());
        List<Destination> destinations = new ArrayList<>(destinationRepository.findByActiveTrue());

        // Sort FIFO: earliest harvest first
        batches.sort(Comparator.comparing(b -> b.getHarvestTimestamp() != null ? b.getHarvestTimestamp() : LocalDateTime.MIN));

        // Sort destinations greedily by offered price descending
        destinations.sort((d1, d2) -> Double.compare(d2.getOfferedPricePerKg(), d1.getOfferedPricePerKg()));

        Map<Long, Double> remainingDemandMap = new HashMap<>();
        Map<Long, Double> remainingCapacityMap = new HashMap<>();
        for (Destination d : destinations) {
            remainingDemandMap.put(d.getId(), d.getDemandKg());
            remainingCapacityMap.put(d.getId(), d.getCapacityLimitKg());
        }

        PlanResult planResult = PlanResult.builder()
                .planType("BASELINE_FIFO")
                .scenarioName(scenarioName != null ? scenarioName : "Standard Baseline Run")
                .executedAt(LocalDateTime.now())
                .totalBatchesConsidered(batches.size())
                .totalDestinationsConsidered(destinations.size())
                .build();

        double totalStockKg = 0.0;
        double allocatedStockKg = 0.0;
        double spoiledStockKg = 0.0;
        double grossRevenue = 0.0;
        double totalTransportCost = 0.0;
        double totalHandlingCost = 0.0;
        double totalDiscountCost = 0.0;
        double totalSpoilagePenalty = 0.0;
        double totalDemandRequested = destinations.stream().mapToDouble(Destination::getDemandKg).sum();
        double totalDemandFulfilledValid = 0.0;

        for (Batch batch : batches) {
            double batchStock = batch.getQuantityKg();
            totalStockKg += batchStock;
            double remainingBatchQty = batchStock;

            for (Destination dest : destinations) {
                if (remainingBatchQty <= 0.001) break;

                double remDemand = remainingDemandMap.getOrDefault(dest.getId(), 0.0);
                double remCapacity = remainingCapacityMap.getOrDefault(dest.getId(), 0.0);
                double allocableCap = Math.min(remDemand, remCapacity);

                if (allocableCap <= 0.001) continue;

                double allocatedQty = Math.min(remainingBatchQty, allocableCap);
                remainingBatchQty -= allocatedQty;
                remainingDemandMap.put(dest.getId(), remDemand - allocatedQty);
                remainingCapacityMap.put(dest.getId(), remCapacity - allocatedQty);

                // Check shelf-life feasibility under baseline (which distributor ignored)
                FeasibilityCheckResult feasibility =
                        feasibilityEngine.checkFeasibility(batch, dest, false);

                double transportCost = allocatedQty * (dest.getTransportCostPerKg() != null ? dest.getTransportCostPerKg() : 0.0);
                double handlingCost = allocatedQty * (dest.getHandlingCostPerKg() != null ? dest.getHandlingCostPerKg() : 0.0);
                double baseCost = batch.getBaseCostPerKg() != null ? batch.getBaseCostPerKg() : 20.0;

                boolean isFeasible = feasibility.isFeasible();
                double effectivePrice = dest.getOfferedPricePerKg();
                double revenue = 0.0;
                double spoilageCost = 0.0;
                double netMargin = 0.0;
                String explanation;
                String preventionBenefit;

                if (isFeasible) {
                    revenue = allocatedQty * effectivePrice;
                    spoilageCost = 0.0;
                    netMargin = revenue - transportCost - handlingCost;
                    totalDemandFulfilledValid += allocatedQty;
                    explanation = String.format("Baseline FIFO dispatched %s kg to highest-price destination %s (\u20B9%s/kg). Produce arrived within shelf life with %s hrs buffer.",
                            round(allocatedQty), dest.getName(), dest.getOfferedPricePerKg(), round(feasibility.getShelfLifeBufferHours()));
                    preventionBenefit = "Arrival feasible. Full mandi revenue realized.";
                } else {
                    // SPOILED IN TRANSIT!
                    revenue = 0.0;
                    spoilageCost = allocatedQty * baseCost;
                    spoiledStockKg += allocatedQty;
                    totalSpoilagePenalty += spoilageCost;
                    netMargin = -(transportCost + handlingCost + spoilageCost);
                    explanation = String.format("CRITICAL FAILURE (Baseline Blind Spot): Dispatched %s kg to %s solely chasing high price \u20B9%s/kg. Transit time (%s hrs) exceeded shelf life (%s hrs). 100%% produce spoiled on arrival!",
                            round(allocatedQty), dest.getName(), dest.getOfferedPricePerKg(), round(feasibility.getTotalTransitHours()), round(batch.getRemainingShelfLifeHours()));
                    preventionBenefit = String.format("Severe loss of \u20B9%s (spoiled stock) + \u20B9%s (wasted transport/handling).",
                            round(spoilageCost), round(transportCost + handlingCost));
                }

                allocatedStockKg += allocatedQty;
                grossRevenue += revenue;
                totalTransportCost += transportCost;
                totalHandlingCost += handlingCost;

                Allocation allocation = Allocation.builder()
                        .batchCode(batch.getBatchCode())
                        .commodity(batch.getCommodity())
                        .destinationCode(dest.getDestinationCode())
                        .destinationName(dest.getName())
                        .allocatedQuantityKg(round(allocatedQty))
                        .transportTimeHours(dest.getTransportTimeHours())
                        .handlingTimeHours(dest.getHandlingTimeHours())
                        .totalTransitHours(round(feasibility.getTotalTransitHours()))
                        .remainingShelfLifeHours(batch.getRemainingShelfLifeHours())
                        .shelfLifeBufferAtArrivalHours(round(feasibility.getShelfLifeBufferHours()))
                        .isFeasible(isFeasible)
                        .infeasibilityReason(isFeasible ? null : feasibility.getReason())
                        .baseOfferedPricePerKg(dest.getOfferedPricePerKg())
                        .discountPercentage(0.0)
                        .effectivePricePerKg(effectivePrice)
                        .grossRevenueInr(round(revenue))
                        .transportCostInr(round(transportCost))
                        .handlingCostInr(round(handlingCost))
                        .discountCostInr(0.0)
                        .spoilageCostInr(round(spoilageCost))
                        .netMarginInr(round(netMargin))
                        .priorityScore(dest.getOfferedPricePerKg())
                        .riskTier(isFeasible ? "SAFE" : "CRITICAL")
                        .explanation(explanation)
                        .spoilagePreventionBenefit(preventionBenefit)
                        .build();

                planResult.addAllocation(allocation);
            }

            // Any remaining unallocated stock expires at farm gate
            if (remainingBatchQty > 0.001) {
                double unallocSpoilage = remainingBatchQty * (batch.getBaseCostPerKg() != null ? batch.getBaseCostPerKg() : 20.0);
                spoiledStockKg += remainingBatchQty;
                totalSpoilagePenalty += unallocSpoilage;

                Allocation unallocatedRecord = Allocation.builder()
                        .batchCode(batch.getBatchCode())
                        .commodity(batch.getCommodity())
                        .destinationCode("UNALLOCATED")
                        .destinationName("Unallocated / Farm Gate Spoilage")
                        .allocatedQuantityKg(round(remainingBatchQty))
                        .transportTimeHours(0.0)
                        .handlingTimeHours(0.0)
                        .totalTransitHours(0.0)
                        .remainingShelfLifeHours(batch.getRemainingShelfLifeHours())
                        .shelfLifeBufferAtArrivalHours(0.0)
                        .isFeasible(false)
                        .infeasibilityReason("Unallocated stock remained unsold and expired at hub.")
                        .baseOfferedPricePerKg(0.0)
                        .discountPercentage(0.0)
                        .effectivePricePerKg(0.0)
                        .grossRevenueInr(0.0)
                        .transportCostInr(0.0)
                        .handlingCostInr(0.0)
                        .discountCostInr(0.0)
                        .spoilageCostInr(round(unallocSpoilage))
                        .netMarginInr(-round(unallocSpoilage))
                        .priorityScore(0.0)
                        .riskTier("CRITICAL")
                        .explanation(String.format("Stock remained unallocated under FIFO greedy selection and spoiled at origin: \u20B9%s loss.", round(unallocSpoilage)))
                        .spoilagePreventionBenefit("Unsold farm spoilage.")
                        .build();

                planResult.addAllocation(unallocatedRecord);
            }
        }

        double netRevenue = grossRevenue - totalTransportCost - totalHandlingCost - totalDiscountCost - totalSpoilagePenalty;
        double fulfillmentPct = totalDemandRequested > 0 ? (totalDemandFulfilledValid / totalDemandRequested) * 100.0 : 0.0;
        double feasibilityPct = allocatedStockKg > 0 ? ((allocatedStockKg - spoiledStockKg) / allocatedStockKg) * 100.0 : 0.0;
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
