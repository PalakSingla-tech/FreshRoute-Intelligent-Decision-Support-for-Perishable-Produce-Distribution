package com.FreshRoute.mapper;

import com.FreshRoute.dto.BatchPerishabilityDto;
import com.FreshRoute.dto.ExecutiveDashboardDto;
import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.model.Batch;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Component
public class AnalyticsMapper {

    public BatchPerishabilityDto toBatchPerishabilityDto(Batch batch, String riskTier) {
        if (batch == null) {
            return null;
        }

        return BatchPerishabilityDto.builder()
                .batchCode(batch.getBatchCode())
                .commodity(batch.getCommodity())
                .quantityKg(batch.getQuantityKg())
                .remainingShelfLifeHours(batch.getRemainingShelfLifeHours())
                .storageCondition(batch.getStorageCondition())
                .storageTempC(batch.getStorageTempC())
                .riskTier(riskTier)
                .origin(batch.getOriginLocation())
                .build();
    }

    public ExecutiveDashboardDto toExecutiveDashboardDto(
            PlanComparisonDto comparison,
            Map<String, Long> riskCount,
            List<BatchPerishabilityDto> liveBatches,
            Map<String, Double> commodityStock) {
        return ExecutiveDashboardDto.builder()
                .benchmark(comparison)
                .inventoryPerishabilityBreakdown(riskCount)
                .liveBatches(liveBatches)
                .commodityStockSummary(commodityStock)
                .build();
    }
}
