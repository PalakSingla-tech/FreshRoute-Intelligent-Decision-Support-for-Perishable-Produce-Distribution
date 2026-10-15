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
public class ReportEvaluationDto {
    private PlanResult baselinePlan;
    private PlanResult freshRoutePlan;
    private List<MetricComparisonRowDto> comparisonRows;
    private List<ConstraintAuditItemDto> constraintAudit;
    private MandiManifestDto manifest;
    private String executiveSummary;
}
