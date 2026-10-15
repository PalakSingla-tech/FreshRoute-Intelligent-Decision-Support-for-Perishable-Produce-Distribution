package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConstraintAuditItemDto {
    private String id;
    private String dimension;
    private String ruleDescription;
    private boolean baselinePassed;
    private int baselinePassCount;
    private int baselineTotalCount;
    private boolean freshPassed;
    private int freshPassCount;
    private int freshTotalCount;
    private String baselineDetail;
    private String freshDetail;
}
