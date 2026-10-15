package com.FreshRoute.service;

import com.FreshRoute.dto.DiscountRecommendation;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DiscountEngine {

    /**
     * Determines the optimal discount recommendation based on remaining shelf life buffer upon arrival.
     * Disclosed Perishability Pricing Model:
     * - Buffer > 24 hours: Safe (0% discount, full margin)
     * - Buffer 8 to 24 hours: Moderate Risk (15% discount, +25% expected retail sell-through)
     * - Buffer 0 to 8 hours: High Spoilage Risk (30% discount, +50% clearance velocity)
     * - Buffer < 0 hours: Infeasible / Write-off
     */
    public DiscountRecommendation calculateDiscount(double bufferHours, double baseOfferedPrice) {
        if (bufferHours > 24.0) {
            return DiscountRecommendation.builder()
                    .discountPercentage(0.0)
                    .effectivePricePerKg(round(baseOfferedPrice))
                    .riskTier("SAFE")
                    .expectedOfftakeBoostPercentage(0.0)
                    .disclosedAssumption("Inventory has >24 hrs buffer post-arrival. Standard retail velocity will clear 100% stock without discounting.")
                    .operationalAdvice("No discount required. Dispatch at standard premium mandi rate.")
                    .build();
        } else if (bufferHours >= 8.0) {
            double discountPct = 15.0;
            double discountedPrice = baseOfferedPrice * (1.0 - discountPct / 100.0);
            return DiscountRecommendation.builder()
                    .discountPercentage(discountPct)
                    .effectivePricePerKg(round(discountedPrice))
                    .riskTier("MODERATE")
                    .expectedOfftakeBoostPercentage(25.0)
                    .disclosedAssumption("Disclosed Assumption: A 15% clearance discount increases expected retail offtake velocity by 25%, mitigating end-of-day unsold stock.")
                    .operationalAdvice("Recommend 15% promotional discount to secondary wholesalers upon arrival to ensure rapid liquidation.")
                    .build();
        } else if (bufferHours > 0.0) {
            double discountPct = 30.0;
            double discountedPrice = baseOfferedPrice * (1.0 - discountPct / 100.0);
            return DiscountRecommendation.builder()
                    .discountPercentage(discountPct)
                    .effectivePricePerKg(round(discountedPrice))
                    .riskTier("HIGH")
                    .expectedOfftakeBoostPercentage(50.0)
                    .disclosedAssumption("Disclosed Assumption: High perishability risk (<8 hrs buffer). A 30% dynamic discount boosts immediate bulk offtake by 50%, salvaging capital over total write-off.")
                    .operationalAdvice("Trigger urgent flash-clearance discount immediately to food processors or local restaurants.")
                    .build();
        } else {
            return DiscountRecommendation.builder()
                    .discountPercentage(100.0)
                    .effectivePricePerKg(0.0)
                    .riskTier("CRITICAL")
                    .expectedOfftakeBoostPercentage(0.0)
                    .disclosedAssumption("Zero buffer: Inventory arrives at or past terminal shelf life. 100% loss incurred if dispatched.")
                    .operationalAdvice("DO NOT DISPATCH on this route. Redirect to immediate local micro-market or processing unit.")
                    .build();
        }
    }

    private double round(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}
