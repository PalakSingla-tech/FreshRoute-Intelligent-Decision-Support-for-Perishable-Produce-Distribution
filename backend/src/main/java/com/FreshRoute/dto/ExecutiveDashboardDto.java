package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutiveDashboardDto {
    private PlanComparisonDto benchmark;
    private Map<String, Long> inventoryPerishabilityBreakdown;
    private List<BatchPerishabilityDto> liveBatches;
    private Map<String, Double> commodityStockSummary;
}
