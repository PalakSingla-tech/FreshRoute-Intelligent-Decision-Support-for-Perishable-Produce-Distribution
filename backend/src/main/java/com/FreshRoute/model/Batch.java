package com.FreshRoute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String batchCode;

    @Column(nullable = false)
    private String commodity; // Tomato, Banana, Spinach, Mango

    private String originLocation; // Nashik Hub, Kolar Farm Hub, Ratnagiri Orchard

    @Column(nullable = false)
    private Double quantityKg;

    @Column(nullable = false)
    private Double remainingShelfLifeHours;

    private Double shelfLifeMinHours; // Lower bound (conservative)

    private Double shelfLifeMaxHours; // Upper bound (optimistic)

    private Double baseCostPerKg; // Procurement/Farmer cost (₹)

    private Double referenceMarketPricePerKg; // Benchmark mandi price (₹)

    private String storageCondition; // e.g. "Ambient 26°C", "Cold Storage 4°C"

    private Double storageTempC; // Monitored temperature in °C

    private Double perishabilityFactor; // Ethylene / degradation sensitivity (0.1 to 1.0)

    private LocalDateTime harvestTimestamp;

    @Column(length = 500)
    private String notes;

    private String warehouseId; // e.g. demo-hub-central, demo-hub-north, demo-hub-south

    private String emoji; // e.g. 🍅, 🍌, 🥬

    @Column(length = 500)
    private String recommendedAction; // e.g. "Dispatch now to Ludhiana mandi"

    private String respirationRate;

    private String optimumTemp;

    private LocalDateTime packedAt;

    public Double getEffectiveShelfLife(boolean conservative) {
        if (conservative && shelfLifeMinHours != null && shelfLifeMinHours > 0) {
            return shelfLifeMinHours;
        }
        return remainingShelfLifeHours;
    }
}
