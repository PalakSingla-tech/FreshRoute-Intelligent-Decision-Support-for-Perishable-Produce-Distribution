package com.FreshRoute.service;

import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.dto.PlanRequestDto;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.repository.PlanResultRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlanService {

    private final FreshRouteOptimizerService freshRouteOptimizerService;
    private final BaselinePlannerService baselinePlannerService;
    private final PlanComparisonService planComparisonService;
    private final PlanResultRepository planResultRepository;

    public PlanResult executeFreshRoutePlan(PlanRequestDto request) {
        if (request == null) {
            request = PlanRequestDto.builder().build();
        }
        return freshRouteOptimizerService.executeFreshRoutePlan(request);
    }

    public PlanResult executeBaselinePlan(String scenarioName) {
        String effectiveScenarioName = (scenarioName != null && !scenarioName.trim().isEmpty())
                ? scenarioName
                : "Standard Baseline Run";
        return baselinePlannerService.executeBaselinePlan(effectiveScenarioName);
    }

    public PlanComparisonDto comparePlans(PlanRequestDto request) {
        if (request == null) {
            request = PlanRequestDto.builder().build();
        }
        return planComparisonService.runAndCompare(request);
    }

    public PlanComparisonDto comparePlans(Boolean conservative, String scenarioName) {
        PlanRequestDto request = PlanRequestDto.builder()
                .conservativeShelfLife(conservative != null ? conservative : false)
                .scenarioName(scenarioName != null ? scenarioName : "Live Benchmark Comparison")
                .build();
        return planComparisonService.runAndCompare(request);
    }

    public Map<String, PlanResult> getLatestPlans() {
        Map<String, PlanResult> latest = new HashMap<>();
        planResultRepository.findTopByPlanTypeOrderByExecutedAtDesc("BASELINE_FIFO")
                .ifPresent(p -> latest.put("baseline", p));
        planResultRepository.findTopByPlanTypeOrderByExecutedAtDesc("FRESHROUTE_OPTIMIZED")
                .ifPresent(p -> latest.put("freshRoute", p));
        return latest;
    }

    public Optional<PlanResult> getPlanById(Long id) {
        return planResultRepository.findById(id);
    }
}
