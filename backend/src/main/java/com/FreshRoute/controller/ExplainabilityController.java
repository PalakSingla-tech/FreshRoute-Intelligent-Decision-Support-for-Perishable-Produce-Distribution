package com.FreshRoute.controller;

import com.FreshRoute.dto.BatchDecisionAuditDto;
import com.FreshRoute.model.Allocation;
import com.FreshRoute.service.ExplainabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/explain")
@RequiredArgsConstructor
public class ExplainabilityController {

    private final ExplainabilityService explainabilityService;

    @GetMapping("/batch/{batchCode}")
    public ResponseEntity<BatchDecisionAuditDto> auditBatchDecision(@PathVariable String batchCode) {
        return explainabilityService.auditBatchDecision(batchCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/allocation/{id}")
    public ResponseEntity<Allocation> getAllocationExplanation(@PathVariable Long id) {
        return explainabilityService.getAllocationExplanation(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
