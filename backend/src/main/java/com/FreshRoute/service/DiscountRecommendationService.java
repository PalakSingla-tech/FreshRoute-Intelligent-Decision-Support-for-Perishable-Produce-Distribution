package com.FreshRoute.service;

import com.FreshRoute.dto.BatchDiscountRecommendationDto;
import com.FreshRoute.dto.DestinationFeasibilityAnalysis;
import com.FreshRoute.dto.DiscountRecommendation;
import com.FreshRoute.dto.DiscountResultDto;
import com.FreshRoute.dto.DiscountSummaryDto;
import com.FreshRoute.mapper.ExplainabilityMapper;
import com.FreshRoute.model.Allocation;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import com.FreshRoute.repository.PlanResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class DiscountRecommendationService {

    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final PlanResultRepository planResultRepository;
    private final FeasibilityEngine feasibilityEngine;
    private final DiscountEngine discountEngine;
    private final ExplainabilityMapper explainabilityMapper;

    public DiscountResultDto generateDiscountRecommendations(Long planId) {
        List<Batch> batches = batchRepository.findAll();
        List<Destination> destinations = destinationRepository.findAll();

        PlanResult plan = null;
        if (planId != null) {
            plan = planResultRepository.findById(planId).orElse(null);
        }
        if (plan == null) {
            List<PlanResult> plans = planResultRepository.findAll();
            if (!plans.isEmpty()) {
                plan = plans.get(plans.size() - 1);
            }
        }

        Map<String, Double> allocatedByBatch = new HashMap<>();
        Map<String, Double> allocatedByDest = new HashMap<>();
        double planDiscountedRevenue = 0.0;

        if (plan != null && plan.getAllocations() != null) {
            for (Allocation a : plan.getAllocations()) {
                allocatedByBatch.put(a.getBatchCode(),
                        allocatedByBatch.getOrDefault(a.getBatchCode(), 0.0) + a.getAllocatedQuantityKg());
                allocatedByDest.put(a.getDestinationCode(),
                        allocatedByDest.getOrDefault(a.getDestinationCode(), 0.0) + a.getAllocatedQuantityKg());
                planDiscountedRevenue += (a.getAllocatedQuantityKg() * a.getEffectivePricePerKg());
            }
        }

        List<BatchDiscountRecommendationDto> recommendations = new ArrayList<>();
        double atRiskUnallocatedKg = 0.0;
        int discountedBatchCount = 0;
        double potentialClearanceRevenue = 0.0;

        for (Batch b : batches) {
            double remainingHours = b.getRemainingShelfLifeHours() != null ? b.getRemainingShelfLifeHours() : 12.0;
            String risk = remainingHours < 8.0 ? "High" : (remainingHours <= 24.0 ? "Medium" : "Low");
            double allocatedKg = allocatedByBatch.getOrDefault(b.getBatchCode(), 0.0);
            double unallocatedKg = Math.max(0.0, b.getQuantityKg() - allocatedKg);

            if (unallocatedKg <= 0.01) {
                continue;
            }

            if (remainingHours <= 24.0) {
                atRiskUnallocatedKg += unallocatedKg;
            }

            // Check destination options
            List<DestinationFeasibilityAnalysis> candidateChecks = new ArrayList<>();
            DestinationFeasibilityAnalysis redirectTo = null;

            for (Destination d : destinations) {
                FeasibilityCheckResult feas = feasibilityEngine.checkFeasibility(b, d, false);
                double buffer = feas.getShelfLifeBufferHours();
                DiscountRecommendation disc = discountEngine.calculateDiscount(buffer, d.getOfferedPricePerKg());
                double freight = d.getTransportCostPerKg() != null ? d.getTransportCostPerKg() : 0.0;
                double handling = d.getHandlingCostPerKg() != null ? d.getHandlingCostPerKg() : 0.0;
                double baseCost = b.getBaseCostPerKg() != null ? b.getBaseCostPerKg() : 20.0;
                double margin = disc.getEffectivePricePerKg() - freight - handling - baseCost;

                DestinationFeasibilityAnalysis check = explainabilityMapper.toDestinationFeasibilityAnalysis(
                        d, feas, disc, margin, feas.getReason());
                candidateChecks.add(check);

                double destAlloc = allocatedByDest.getOrDefault(d.getDestinationCode(), 0.0);
                double spareCapacity = Math.max(0.0, d.getCapacityLimitKg() - destAlloc);

                if (feas.isFeasible() && buffer >= 2.0 && spareCapacity >= 100.0 && redirectTo == null) {
                    redirectTo = check;
                }
            }

            String action;
            Double discountRate = null;
            Double discountedPricePerKg = null;
            double assumedSellableKg = unallocatedKg * 0.50; // 50% clearance sell-through assumption
            Double potentialRevenue = null;
            String reason;

            double basePrice = b.getReferenceMarketPricePerKg() != null ? b.getReferenceMarketPricePerKg() : 25.0;

            if (redirectTo != null) {
                action = "redirect";
                reason = String.format("Redirect %s kg unallocated surplus to %s (%s hrs transit, clears buffer)",
                        Math.round(unallocatedKg), redirectTo.getDestinationName(), Math.round(redirectTo.getTotalTransitHours() * 10.0) / 10.0);
            } else if (remainingHours <= 24.0) {
                action = "discount";
                discountRate = "High".equals(risk) ? 0.25 : 0.15;
                discountedPricePerKg = Math.round(basePrice * (1.0 - discountRate) * 100.0) / 100.0;
                potentialRevenue = Math.round(assumedSellableKg * discountedPricePerKg * 100.0) / 100.0;
                potentialClearanceRevenue += potentialRevenue;
                discountedBatchCount++;
                reason = String.format("Apply %s%% clearance discount for local immediate liquidation within %s hrs remaining shelf life",
                        Math.round(discountRate * 100), Math.round(remainingHours));
            } else {
                action = "no-feasible-sale";
                reason = "No active destination currently has spare capacity quota for this unallocated surplus";
            }

            recommendations.add(BatchDiscountRecommendationDto.builder()
                    .batch(b)
                    .risk(risk)
                    .unallocatedKg(Math.round(unallocatedKg * 10.0) / 10.0)
                    .action(action)
                    .discountRate(discountRate)
                    .discountedPricePerKg(discountedPricePerKg)
                    .assumedSellableKg(Math.round(assumedSellableKg * 10.0) / 10.0)
                    .potentialRevenueInr(potentialRevenue)
                    .redirectTo(redirectTo)
                    .destinationChecks(candidateChecks)
                    .reason(reason)
                    .build());
        }

        DiscountSummaryDto summary = DiscountSummaryDto.builder()
                .atRiskUnallocatedKg(Math.round(atRiskUnallocatedKg))
                .discountedBatchCount(discountedBatchCount)
                .planDiscountedRevenueInr(Math.round(planDiscountedRevenue))
                .potentialClearanceRevenueInr(Math.round(potentialClearanceRevenue))
                .build();

        return DiscountResultDto.builder()
                .recommendations(recommendations)
                .summary(summary)
                .build();
    }
}
