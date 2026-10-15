package com.FreshRoute.controller;

import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.dto.PlanRequestDto;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.service.PlanService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/plan")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @PostMapping("/freshroute")
    public ResponseEntity<PlanResult> runFreshRoutePlan(@RequestBody(required = false) PlanRequestDto request) {
        PlanResult result = planService.executeFreshRoutePlan(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/baseline")
    public ResponseEntity<PlanResult> runBaselinePlan(@RequestBody(required = false) Map<String, String> body) {
        String scenarioName = body != null ? body.get("scenarioName") : null;
        PlanResult result = planService.executeBaselinePlan(scenarioName);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/compare")
    public ResponseEntity<PlanComparisonDto> comparePlansPost(@RequestBody(required = false) PlanRequestDto request) {
        PlanComparisonDto comparison = planService.comparePlans(request);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/compare")
    public ResponseEntity<PlanComparisonDto> comparePlansGet(
            @RequestParam(required = false, defaultValue = "false") Boolean conservative,
            @RequestParam(required = false) String scenarioName) {
        PlanComparisonDto comparison = planService.comparePlans(conservative, scenarioName);
        return ResponseEntity.ok(comparison);
    }

    @GetMapping("/latest")
    public ResponseEntity<Map<String, PlanResult>> getLatestPlans() {
        return ResponseEntity.ok(planService.getLatestPlans());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PlanResult> getPlanById(@PathVariable Long id) {
        return planService.getPlanById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
