package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DestinationStatsDto {
    private String destinationCode;
    private String name;
    private double demandKg;
    private double capacityKg;
    private double allocatedKg;
    private double remainingDemandKg;
    private double capacityUsedPct;
    private boolean hasViolation;
    private double travelHours;
    private double marketPricePerKg;
}
