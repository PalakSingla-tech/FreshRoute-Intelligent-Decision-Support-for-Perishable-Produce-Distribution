package com.FreshRoute.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanRequestDto {
    @Builder.Default
    private Boolean conservativeShelfLife = false;

    @Builder.Default
    private Double spoilageWeight = 0.40;

    @Builder.Default
    private Double marginWeight = 0.30;

    @Builder.Default
    private Double urgencyWeight = 0.20;

    @Builder.Default
    private Double costWeight = 0.10;

    private String scenarioName;
}
