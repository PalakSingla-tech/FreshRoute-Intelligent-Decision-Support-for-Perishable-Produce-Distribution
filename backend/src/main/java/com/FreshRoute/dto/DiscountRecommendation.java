package com.FreshRoute.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DiscountRecommendation {
    private double discountPercentage;
    private double effectivePricePerKg;
    private String riskTier; // SAFE, MODERATE, HIGH, CRITICAL
    private String disclosedAssumption;
    private double expectedOfftakeBoostPercentage;
    private String operationalAdvice;
}
