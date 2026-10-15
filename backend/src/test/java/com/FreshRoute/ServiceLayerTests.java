package com.FreshRoute;

import com.FreshRoute.dto.*;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.service.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class ServiceLayerTests {

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private ExplainabilityService explainabilityService;

    @Autowired
    private DestinationService destinationService;

    @Autowired
    private InventoryService inventoryService;

    @Autowired
    private PlanService planService;

    @Autowired
    private com.FreshRoute.mapper.AnalyticsMapper analyticsMapper;

    @Autowired
    private com.FreshRoute.mapper.ExplainabilityMapper explainabilityMapper;

    @Autowired
    private com.FreshRoute.mapper.DestinationMapper destinationMapper;

    @Autowired
    private com.FreshRoute.mapper.BatchMapper batchMapper;

    @Autowired
    private com.FreshRoute.mapper.DisruptionMapper disruptionMapper;

    @Test
    @DisplayName("AnalyticsService returns aggregated executive dashboard with risk breakdown")
    void testAnalyticsServiceDashboard() {
        ExecutiveDashboardDto dashboard = analyticsService.getExecutiveDashboard();
        assertNotNull(dashboard);
        assertNotNull(dashboard.getBenchmark());
        assertNotNull(dashboard.getInventoryPerishabilityBreakdown());
        assertNotNull(dashboard.getLiveBatches());
        assertFalse(dashboard.getLiveBatches().isEmpty());
        assertTrue(dashboard.getInventoryPerishabilityBreakdown().containsKey("SAFE"));
    }

    @Test
    @DisplayName("ExplainabilityService provides audit for existing batch")
    void testExplainabilityServiceAudit() {
        List<Batch> batches = inventoryService.getAllBatches();
        assertFalse(batches.isEmpty(), "Batches must be seeded");

        String batchCode = batches.get(0).getBatchCode();
        Optional<BatchDecisionAuditDto> auditOpt = explainabilityService.auditBatchDecision(batchCode);
        assertTrue(auditOpt.isPresent());

        BatchDecisionAuditDto audit = auditOpt.get();
        assertEquals(batchCode, audit.getBatchCode());
        assertNotNull(audit.getCandidateRoutes());
        assertFalse(audit.getCandidateRoutes().isEmpty());
    }

    @Test
    @DisplayName("DestinationService retrieves and updates destinations correctly")
    void testDestinationService() {
        List<Destination> destinations = destinationService.getAllDestinations();
        assertFalse(destinations.isEmpty());

        Destination dest = destinations.get(0);
        Optional<Destination> fetched = destinationService.getDestinationById(dest.getId());
        assertTrue(fetched.isPresent());

        RouteDisruptionDto disruption = RouteDisruptionDto.builder()
                .delayHours(5.0)
                .active(true)
                .build();
        Optional<Destination> disrupted = destinationService.disruptRoute(dest.getId(), disruption);
        assertTrue(disrupted.isPresent());
        assertEquals(5.0, disrupted.get().getDelayHours());
    }

    @Test
    @DisplayName("InventoryService manages batch lifecycle cleanly")
    void testInventoryServiceLifecycle() {
        Batch newBatch = Batch.builder()
                .commodity("Test Apple")
                .quantityKg(500.0)
                .remainingShelfLifeHours(48.0)
                .storageCondition("Cold 4C")
                .storageTempC(4.0)
                .baseCostPerKg(30.0)
                .referenceMarketPricePerKg(50.0)
                .originLocation("Shimla")
                .build();

        Batch created = inventoryService.createBatch(newBatch);
        assertNotNull(created.getId());
        assertNotNull(created.getBatchCode());
        assertNotNull(created.getHarvestTimestamp());

        created.setQuantityKg(450.0);
        Optional<Batch> updated = inventoryService.updateBatch(created.getId(), created);
        assertTrue(updated.isPresent());
        assertEquals(450.0, updated.get().getQuantityKg());

        boolean deleted = inventoryService.deleteBatch(created.getId());
        assertTrue(deleted);
    }

    @Test
    @DisplayName("PlanService executes optimization and baseline comparison")
    void testPlanService() {
        PlanRequestDto req = PlanRequestDto.builder()
                .scenarioName("Service Layer Test Plan")
                .build();

        PlanResult result = planService.executeFreshRoutePlan(req);
        assertNotNull(result);
        assertNotNull(result.getAllocations());

        Map<String, PlanResult> latest = planService.getLatestPlans();
        assertNotNull(latest);
    }

    @Test
    @DisplayName("Mapper classes perform transformations accurately")
    void testMapperOperations() {
        // AnalyticsMapper
        Batch testBatch = Batch.builder().batchCode("M-01").commodity("Tomato").quantityKg(100.0).remainingShelfLifeHours(15.0).build();
        BatchPerishabilityDto batchDto = analyticsMapper.toBatchPerishabilityDto(testBatch, "HIGH");
        assertNotNull(batchDto);
        assertEquals("HIGH", batchDto.getRiskTier());
        assertEquals("Tomato", batchDto.getCommodity());

        // BatchMapper
        Batch targetBatch = new Batch();
        batchMapper.updateEntity(targetBatch, testBatch);
        assertEquals("Tomato", targetBatch.getCommodity());
        assertEquals(100.0, targetBatch.getQuantityKg());

        // DisruptionMapper
        HighwayBlockadeDto blockadeDto = HighwayBlockadeDto.builder().destinationCode("DEST-MUMBAI").delayHours(6.0).build();
        DisruptionRequestDto req = disruptionMapper.toDisruptionRequestDto(blockadeDto);
        assertEquals("DEST-MUMBAI", req.getDestinationCode());
        assertEquals(6.0, req.getDelayHours());
    }

    @Autowired
    private DataInitializerService dataInitializerService;

    @Test
    @DisplayName("DataInitializerService seeds all batches and destinations cleanly")
    void testSeedData() {
        dataInitializerService.seedData();
    }
}
