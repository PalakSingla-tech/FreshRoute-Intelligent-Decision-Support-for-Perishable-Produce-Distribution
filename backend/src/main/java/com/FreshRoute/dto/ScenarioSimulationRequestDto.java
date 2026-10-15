package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioSimulationRequestDto {
    private String delayDestinationId;
    @Builder.Default
    private double extraDelayHours = 0.0;

    private String demandDestinationId;
    private String demandCommodity;
    @Builder.Default
    private double demandChangePct = 0.0;

    @Builder.Default
    private double capacityReductionPct = 0.0;

    @Builder.Default
    private boolean conservativeShelfLife = false;
}
