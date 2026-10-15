package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountSummaryDto {
    private double atRiskUnallocatedKg;
    private int discountedBatchCount;
    private double planDiscountedRevenueInr;
    private double potentialClearanceRevenueInr;
}
