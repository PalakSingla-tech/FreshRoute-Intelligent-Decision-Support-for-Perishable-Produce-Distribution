package com.FreshRoute.dto;

import com.FreshRoute.model.Batch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchDiscountRecommendationDto {
    private Batch batch;
    private String risk; // High, Medium, Low
    private double unallocatedKg;
    private String action; // discount, redirect, no-feasible-sale
    private Double discountRate;
    private Double discountedPricePerKg;
    private double assumedSellableKg;
    private Double potentialRevenueInr;
    private DestinationFeasibilityAnalysis redirectTo;
    private List<DestinationFeasibilityAnalysis> destinationChecks;
    private String reason;
}
