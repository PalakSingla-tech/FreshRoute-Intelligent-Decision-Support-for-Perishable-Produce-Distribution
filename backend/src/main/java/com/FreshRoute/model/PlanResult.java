package com.FreshRoute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "plan_results")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String planType; // "FRESHROUTE_OPTIMIZED" vs "BASELINE_FIFO"

    private String scenarioName; // "Standard Harvest", "Route Delay Disruption", "Heatwave Temperature Abuse"

    private LocalDateTime executedAt;

    private Integer totalBatchesConsidered;
    private Integer totalDestinationsConsidered;

    private Double totalStockKg;
    private Double allocatedStockKg;
    private Double spoiledStockKg;
    private Double unallocatedStockKg;

    private Double grossRevenueInr;
    private Double transportCostInr;
    private Double handlingCostInr;
    private Double discountCostInr;
    private Double spoilagePenaltyInr;
    private Double netRevenueInr;

    private Double demandFulfillmentRate; // Percentage (0.0 to 100.0)
    private Double allocationFeasibilityRate; // Percentage (0.0 to 100.0)
    private Double spoilageRate; // Percentage (0.0 to 100.0)

    @OneToMany(mappedBy = "planResult", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Allocation> allocations = new ArrayList<>();

    public void addAllocation(Allocation allocation) {
        allocations.add(allocation);
        allocation.setPlanResult(this);
    }
}
