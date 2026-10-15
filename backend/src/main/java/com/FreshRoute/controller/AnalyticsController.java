package com.FreshRoute.controller;

import com.FreshRoute.dto.ExecutiveDashboardDto;
import com.FreshRoute.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard")
    public ResponseEntity<ExecutiveDashboardDto> getExecutiveDashboard() {
        ExecutiveDashboardDto dashboard = analyticsService.getExecutiveDashboard();
        return ResponseEntity.ok(dashboard);
    }
}
