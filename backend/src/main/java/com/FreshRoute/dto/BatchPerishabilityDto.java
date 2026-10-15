package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchPerishabilityDto {
    private String batchCode;
    private String commodity;
    private Double quantityKg;
    private Double remainingShelfLifeHours;
    private String storageCondition;
    private Double storageTempC;
    private String riskTier;
    private String origin;
}
