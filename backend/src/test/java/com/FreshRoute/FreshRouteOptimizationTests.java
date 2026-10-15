package com.FreshRoute;

import com.FreshRoute.dto.DiscountRecommendation;
import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.dto.PlanRequestDto;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.service.DiscountEngine;
import com.FreshRoute.service.FeasibilityEngine;
import com.FreshRoute.service.PlanComparisonService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FreshRouteOptimizationTests {

    @Autowired
    private FeasibilityEngine feasibilityEngine;

    @Autowired
    private DiscountEngine discountEngine;

    @Autowired
    private PlanComparisonService planComparisonService;

    @Test
    @DisplayName("Feasibility Engine correctly flags route exceeding shelf life")
    void testFeasibilityCheck() {
        Batch perishableTomato = Batch.builder()
                .batchCode("TEST-TOM")
                .commodity("Tomato")
                .remainingShelfLifeHours(18.0)
                .build();

        Destination distantDelhi = Destination.builder()
                .destinationCode("TEST-DELHI")
                .name("Delhi Mandi")
                .transportTimeHours(26.0)
                .delayHours(0.0)
                .handlingTimeHours(4.0) // total transit: 30.0 hrs
                .active(true)
                .build();

        Destination nearbyPune = Destination.builder()
                .destinationCode("TEST-PUNE")
                .name("Pune Mandi")
                .transportTimeHours(3.5)
                .delayHours(0.0)
                .handlingTimeHours(1.5) // total transit: 5.0 hrs
                .active(true)
                .build();

        FeasibilityCheckResult delhiCheck =
                feasibilityEngine.checkFeasibility(perishableTomato, distantDelhi, false);
        assertFalse(delhiCheck.isFeasible(), "Delhi transit (30h) must be infeasible for 18h tomato!");
        assertTrue(delhiCheck.getShelfLifeBufferHours() < 0);

        FeasibilityCheckResult puneCheck =
                feasibilityEngine.checkFeasibility(perishableTomato, nearbyPune, false);
        assertTrue(puneCheck.isFeasible(), "Pune transit (5h) must be feasible for 18h tomato!");
        assertEquals(13.0, puneCheck.getShelfLifeBufferHours());
    }

    @Test
    @DisplayName("Discount Engine calculates appropriate clearance tiers")
    void testDiscountEngineTiers() {
        // Safe buffer (> 24h)
        DiscountRecommendation safeTier = discountEngine.calculateDiscount(30.0, 30.0);
        assertEquals(0.0, safeTier.getDiscountPercentage());
        assertEquals("SAFE", safeTier.getRiskTier());
        assertEquals(30.0, safeTier.getEffectivePricePerKg());

        // Moderate buffer (8h to 24h) -> 15% discount
        DiscountRecommendation modTier = discountEngine.calculateDiscount(14.0, 30.0);
        assertEquals(15.0, modTier.getDiscountPercentage());
        assertEquals("MODERATE", modTier.getRiskTier());
        assertEquals(25.5, modTier.getEffectivePricePerKg());

        // High risk (< 8h) -> 30% discount
        DiscountRecommendation highTier = discountEngine.calculateDiscount(4.0, 30.0);
        assertEquals(30.0, highTier.getDiscountPercentage());
        assertEquals("HIGH", highTier.getRiskTier());
        assertEquals(21.0, highTier.getEffectivePricePerKg());
    }

    @Test
    @DisplayName("FreshRoute decisively outperforms baseline FIFO in spoilage, fulfillment, and net revenue")
    void testBenchmarkComparison() {
        PlanRequestDto req = PlanRequestDto.builder()
                .scenarioName("Automated Verification Benchmark")
                .build();

        PlanComparisonDto comparison = planComparisonService.runAndCompare(req);

        PlanResult baseline = comparison.getBaseline();
        PlanResult freshRoute = comparison.getFreshRoute();

        assertNotNull(baseline);
        assertNotNull(freshRoute);

        // Verification of core hackathon criteria:
        // 1. Spoilage reduction
        assertTrue(freshRoute.getSpoiledStockKg() < baseline.getSpoiledStockKg(),
                "FreshRoute must have strictly lower spoilage than Baseline!");
        assertTrue(comparison.getSpoilageReductionPercentage() > 40.0,
                "FreshRoute should reduce spoilage by more than 40% vs Baseline!");

        // 2. Net economic outcome
        assertTrue(freshRoute.getNetRevenueInr() > baseline.getNetRevenueInr(),
                "FreshRoute net revenue must exceed Baseline!");

        // 3. Feasibility compliance
        assertEquals(100.0, freshRoute.getAllocationFeasibilityRate(),
                "FreshRoute must achieve 100% feasibility compliance!");
        assertTrue(baseline.getAllocationFeasibilityRate() < freshRoute.getAllocationFeasibilityRate(),
                "Baseline must suffer lower feasibility compliance due to transit expiry!");
    }
}
