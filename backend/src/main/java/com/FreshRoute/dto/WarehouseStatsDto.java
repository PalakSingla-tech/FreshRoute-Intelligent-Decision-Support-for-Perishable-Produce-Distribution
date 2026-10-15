package com.FreshRoute.dto;

import com.FreshRoute.model.Batch;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseStatsDto {
    private String id;
    private String name;
    private double latitude;
    private double longitude;
    private double stockKg;
    private int batchCount;
    private List<Batch> batches;
}
