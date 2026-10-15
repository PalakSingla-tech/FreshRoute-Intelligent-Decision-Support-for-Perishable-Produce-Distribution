package com.FreshRoute.service;

import com.FreshRoute.dto.BatchPerishabilityDto;
import com.FreshRoute.dto.ExecutiveDashboardDto;
import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.mapper.AnalyticsMapper;
import com.FreshRoute.model.Batch;
import com.FreshRoute.repository.BatchRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AnalyticsService {

    private final BatchRepository batchRepository;
    private final PlanComparisonService planComparisonService;
    private final AnalyticsMapper analyticsMapper;

    public AnalyticsService(
            BatchRepository batchRepository,
            PlanComparisonService planComparisonService,
            AnalyticsMapper analyticsMapper) {
        this.batchRepository = batchRepository;
        this.planComparisonService = planComparisonService;
        this.analyticsMapper = analyticsMapper;
    }

    public ExecutiveDashboardDto getExecutiveDashboard() {
        PlanComparisonDto comparison = planComparisonService.runAndCompare(null);

        List<Batch> batches = batchRepository.findAll();

        Map<String, Long> riskCount = new HashMap<>();
        riskCount.put("SAFE", 0L);
        riskCount.put("MODERATE", 0L);
        riskCount.put("HIGH", 0L);
        riskCount.put("CRITICAL", 0L);

        List<BatchPerishabilityDto> batchDtos = new ArrayList<>();
        Map<String, Double> commodityStock = new HashMap<>();

        for (Batch b : batches) {
            String tier = determineRiskTier(b.getRemainingShelfLifeHours());
            riskCount.put(tier, riskCount.getOrDefault(tier, 0L) + 1);

            commodityStock.put(b.getCommodity(),
                    commodityStock.getOrDefault(b.getCommodity(), 0.0) + b.getQuantityKg());

            batchDtos.add(analyticsMapper.toBatchPerishabilityDto(b, tier));
        }

        return analyticsMapper.toExecutiveDashboardDto(comparison, riskCount, batchDtos, commodityStock);
    }

    private String determineRiskTier(Double remainingShelfLifeHours) {
        if (remainingShelfLifeHours == null) {
            return "CRITICAL";
        }
        if (remainingShelfLifeHours > 48.0) {
            return "SAFE";
        } else if (remainingShelfLifeHours >= 24.0) {
            return "MODERATE";
        } else if (remainingShelfLifeHours >= 12.0) {
            return "HIGH";
        } else {
            return "CRITICAL";
        }
    }
}
