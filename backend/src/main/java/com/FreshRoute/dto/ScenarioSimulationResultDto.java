package com.FreshRoute.dto;

import com.FreshRoute.model.PlanResult;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScenarioSimulationResultDto {
    private List<String> activeChanges;
    private PlanResult baselinePlan;
    private PlanResult replannedFreshRoutePlan;
    private PlanComparisonDto planComparison;
    private List<BatchAllocationChangeDto> allocationChanges;
    private String disruptionVerdict;
}
