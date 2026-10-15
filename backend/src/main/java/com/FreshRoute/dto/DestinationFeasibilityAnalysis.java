package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationFeasibilityAnalysis {
    private String destinationCode;
    private String destinationName;
    private double offeredPricePerKg;
    private double totalTransitHours;
    private double shelfLifeBufferHours;
    private boolean isFeasible;
    private String feasibilityVerdict;
    private double recommendedDiscountPercentage;
    private double projectedNetMarginPerKg;
    private String decisionComment;
}
