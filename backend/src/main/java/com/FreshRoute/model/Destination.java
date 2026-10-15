package com.FreshRoute.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "destinations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Destination {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String destinationCode; // DEST-DELHI, DEST-MUMBAI, etc.

    @Column(nullable = false)
    private String name; // Azadpur Mandi, Delhi

    private String region; // North Agro-Zone, West Coast, South Hub

    private String state;

    @Column(nullable = false)
    private Double demandKg;

    @Column(nullable = false)
    private Double offeredPricePerKg; // Offered purchase price at mandi (₹)

    @Column(nullable = false)
    private Double transportTimeHours; // Standard transit duration

    @Column(nullable = false)
    private Double transportCostPerKg; // Logistics freight cost per kg (₹)

    @Column(nullable = false)
    private Double handlingTimeHours; // Unloading & Mandi gate intake time

    @Column(nullable = false)
    private Double handlingCostPerKg; // Mandi labor / handling fee (₹)

    @Column(nullable = false)
    private Double capacityLimitKg; // Max intake quota of the distribution center

    @Builder.Default
    private Boolean active = true; // Set to false if route blocked

    @Builder.Default
    private Double delayHours = 0.0; // Dynamic route delay (e.g. monsoon/traffic delay)

    @Builder.Default
    private Double demandUrgencyWeight = 1.0; // Priority weight for critical demand centers

    private Double latitude; // Geo coordinates for mapping

    private Double longitude;

    public Double getTotalTransitTime() {
        return (transportTimeHours != null ? transportTimeHours : 0.0)
                + (delayHours != null ? delayHours : 0.0)
                + (handlingTimeHours != null ? handlingTimeHours : 0.0);
    }
}
