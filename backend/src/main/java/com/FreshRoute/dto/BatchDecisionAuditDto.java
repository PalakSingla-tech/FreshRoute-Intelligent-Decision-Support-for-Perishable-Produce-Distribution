package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDecisionAuditDto {
    private String batchCode;
    private String commodity;
    private String emoji;
    private String warehouseId;
    private double quantityKg;
    private double remainingShelfLifeHours;
    private String riskLevel; // High, Medium, Low
    private String urgencyTier;
    private String recommendedAction;
    private String spoilageProbability;
    private String respirationRate;
    private String corridorHeatFactor;
    private String q10Factor;
    private String optimumTemp;
    private String degradationThreshold;
    private String transitBuffer;
    private double basePricePerKg;
    private double markdownPct;
    private double effectivePricePerKg;
    private double salvageValueInr;
    private double potentialLossInr;
    private List<DestinationFeasibilityAnalysis> candidateRoutes;
    private String finalRecommendationRationale;
    private String baselineBlindSpotExplanation;
    private String pricingAndDiscountRuleDisclosed;
}
