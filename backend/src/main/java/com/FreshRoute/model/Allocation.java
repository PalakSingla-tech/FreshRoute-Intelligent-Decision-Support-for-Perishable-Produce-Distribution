package com.FreshRoute.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "allocations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String batchCode;

    @Column(nullable = false)
    private String commodity;

    @Column(nullable = false)
    private String destinationCode;

    @Column(nullable = false)
    private String destinationName;

    @Column(nullable = false)
    private Double allocatedQuantityKg;

    private Double transportTimeHours;
    private Double handlingTimeHours;
    private Double totalTransitHours;

    private Double remainingShelfLifeHours;
    private Double shelfLifeBufferAtArrivalHours; // remainingShelfLife - totalTransitHours

    @Column(nullable = false)
    private Boolean isFeasible; // true if buffer >= 0 and within capacity constraints

    private String infeasibilityReason;

    private Double baseOfferedPricePerKg;
    private Double discountPercentage; // e.g. 0.0, 15.0, 30.0 %
    private Double effectivePricePerKg;

    private Double grossRevenueInr;
    private Double transportCostInr;
    private Double handlingCostInr;
    private Double discountCostInr;
    private Double spoilageCostInr;
    private Double netMarginInr;

    private Double priorityScore;
    private String riskTier; // SAFE, MODERATE, HIGH, CRITICAL

    @Column(length = 1000)
    private String explanation; // Explainable decision rationale

    @Column(length = 500)
    private String spoilagePreventionBenefit; // Quantitative economic defense

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_result_id")
    @JsonIgnore
    private PlanResult planResult;
}
