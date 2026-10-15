package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricComparisonRowDto {
    private String key;
    private String label;
    private String unit;
    private String category; // quantity, percentage, currency, count
    private double baselineValue;
    private double freshValue;
    private String absoluteDiff;
    private String relativeChange;
    private Boolean isImprovement;
    private String note;
    private Boolean isInformationalOnly;
}
