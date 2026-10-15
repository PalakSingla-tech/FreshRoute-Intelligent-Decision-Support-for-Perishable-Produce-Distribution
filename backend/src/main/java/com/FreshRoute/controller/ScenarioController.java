package com.FreshRoute.controller;

import com.FreshRoute.dto.DisruptionRequestDto;
import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.service.DisruptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/scenarios")
@RequiredArgsConstructor
public class ScenarioController {

    private final DisruptionService disruptionService;

    @PostMapping("/route-delay")
    public ResponseEntity<Destination> applyRouteDelay(@RequestBody DisruptionRequestDto disruption) {
        Destination updated = disruptionService.applyRouteDisruption(disruption);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/highway-blockade")
    public ResponseEntity<Destination> applyHighwayBlockade(@RequestBody(required = false) Map<String, Object> body) {
        Destination updated = disruptionService.applyHighwayBlockade(body);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/temperature-spike")
    public ResponseEntity<List<Batch>> applyTemperatureSpike(@RequestBody(required = false) Map<String, Object> body) {
        List<Batch> updatedBatches = disruptionService.applyTemperatureSpike(body);
        return ResponseEntity.ok(updatedBatches);
    }

    @PostMapping("/replan")
    public ResponseEntity<PlanComparisonDto> replanUnderDisruption(
            @RequestParam(required = false, defaultValue = "false") Boolean conservative,
            @RequestParam(required = false, defaultValue = "Dynamic Replanning After Disruption") String scenarioName) {
        PlanComparisonDto comparison = disruptionService.replanUnderDisruption(scenarioName, conservative);
        return ResponseEntity.ok(comparison);
    }

    @PostMapping("/simulate")
    public ResponseEntity<com.FreshRoute.dto.ScenarioSimulationResultDto> simulateScenario(
            @RequestBody(required = false) com.FreshRoute.dto.ScenarioSimulationRequestDto request) {
        if (request == null) {
            request = com.FreshRoute.dto.ScenarioSimulationRequestDto.builder().build();
        }
        com.FreshRoute.dto.ScenarioSimulationResultDto result = disruptionService.simulateScenario(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/reset")
    public ResponseEntity<Map<String, String>> resetAllScenarios() {
        disruptionService.resetAllScenarios();
        return ResponseEntity.ok(Map.of("message", "All disruption scenarios reset. Restored standard MoFPI dataset."));
    }
}
