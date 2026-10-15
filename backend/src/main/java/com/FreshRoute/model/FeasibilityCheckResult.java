package com.FreshRoute.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.*;

@Entity
@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
@Builder
public  class FeasibilityCheckResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;
    private boolean feasible;
    private double totalTransitHours;
    private double shelfLifeBufferHours;
    private String reason;

    public FeasibilityCheckResult(
            boolean feasible,
            double totalTransitHours,
            double shelfLifeBufferHours,
            String reason
    ) {
        this.feasible = feasible;
        this.totalTransitHours = totalTransitHours;
        this.shelfLifeBufferHours = shelfLifeBufferHours;
        this.reason = reason;
    }
}
