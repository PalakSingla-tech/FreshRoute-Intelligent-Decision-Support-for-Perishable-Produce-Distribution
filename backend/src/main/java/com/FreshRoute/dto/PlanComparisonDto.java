package com.FreshRoute.dto;

import com.FreshRoute.model.PlanResult;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanComparisonDto {
    private PlanResult baseline;
    private PlanResult freshRoute;

    // Delta metrics
    private Double spoilageReductionKg;
    private Double spoilageReductionPercentage;
    private Double spoilageValueSavedInr;

    private Double demandFulfillmentGainPercentage;
    private Double netRevenueGainInr;
    private Double netRevenueGainPercentage;
    private Double feasibilityGainPercentage;

    private String summaryVerdict;
    private String executiveInsights;
}
