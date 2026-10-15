package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteStatsDto {
    private String routeKey; // e.g. demo-hub-central>ludhiana-mandi
    private String warehouseId;
    private String warehouseName;
    private String destinationCode;
    private String destinationName;
    private double allocatedKg;
    private boolean infeasible;
    private double transitHours;
    private double transportCostInr;
}
