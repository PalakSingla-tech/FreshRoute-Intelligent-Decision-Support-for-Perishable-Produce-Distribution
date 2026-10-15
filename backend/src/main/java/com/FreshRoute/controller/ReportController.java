package com.FreshRoute.controller;

import com.FreshRoute.dto.ConstraintAuditItemDto;
import com.FreshRoute.dto.MandiManifestDto;
import com.FreshRoute.dto.ReportEvaluationDto;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.service.PlanService;
import com.FreshRoute.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final PlanService planService;

    @GetMapping("/evaluation")
    public ResponseEntity<ReportEvaluationDto> getEvaluationReport() {
        ReportEvaluationDto report = reportService.getEvaluationReport();
        return ResponseEntity.ok(report);
    }

    @GetMapping("/constraint-audit")
    public ResponseEntity<List<ConstraintAuditItemDto>> getConstraintAudit() {
        ReportEvaluationDto report = reportService.getEvaluationReport();
        return ResponseEntity.ok(report.getConstraintAudit());
    }

    @GetMapping("/manifest")
    public ResponseEntity<MandiManifestDto> getLatestMandiManifest() {
        PlanResult fresh = planService.getLatestPlans().get("freshRoute");
        if (fresh == null) {
            fresh = planService.executeFreshRoutePlan(null);
        }
        MandiManifestDto manifest = reportService.generateMandiManifest(fresh);
        return ResponseEntity.ok(manifest);
    }
}
