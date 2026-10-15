package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HighwayBlockadeDto {
    private String destinationCode;
    private Double delayHours;
    private String scenarioName;
}
