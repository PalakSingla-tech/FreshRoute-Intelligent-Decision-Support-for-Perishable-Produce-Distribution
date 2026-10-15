package com.FreshRoute.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DisruptionRequestDto {
    private String destinationCode; // e.g. DEST-DELHI
    private Double delayHours; // e.g. 10.0 hours
    private Boolean closeRoute; // e.g. highway closed
    private Double temperatureSpikeC; // e.g. +8.0°C ambient heatwave
    private String scenarioName;
}
