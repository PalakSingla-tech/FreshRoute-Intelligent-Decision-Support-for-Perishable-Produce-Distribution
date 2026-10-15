package com.FreshRoute.controller;

import com.FreshRoute.dto.DiscountResultDto;
import com.FreshRoute.service.DiscountRecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/discounts")
@RequiredArgsConstructor
public class DiscountController {

    private final DiscountRecommendationService discountRecommendationService;

    @GetMapping("/recommendations")
    public ResponseEntity<DiscountResultDto> getRecommendations(
            @RequestParam(required = false) Long planId) {
        DiscountResultDto result = discountRecommendationService.generateDiscountRecommendations(planId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/rules")
    public ResponseEntity<Map<String, Object>> getDiscountRules() {
        return ResponseEntity.ok(Map.of(
                "highRiskThresholdHours", 8,
                "highRiskDiscountPercentage", 25.0,
                "mediumRiskThresholdHours", 24,
                "mediumRiskDiscountPercentage", 15.0,
                "safeThresholdHours", 24,
                "safeDiscountPercentage", 0.0,
                "clearanceSellThroughAssumption", "50% off-take velocity increase under clearance discount",
                "policy", "Perishability-indexed dynamic clearance pricing to minimize physical produce dumping"
        ));
    }
}
