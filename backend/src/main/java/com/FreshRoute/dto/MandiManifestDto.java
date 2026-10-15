package com.FreshRoute.dto;

import com.FreshRoute.model.Allocation;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MandiManifestDto {
    private String manifestNumber; // PB-2026-OCT-8821
    private LocalDateTime issuedAt;
    private String validityWindow; // 24-Hour Rolling Window
    private String authorizationStatus; // AUTH: PASS-VERIFIED (APMC Yard Fast-Track)
    private String fleetVehicle; // PB-08-CZ-4109
    private String coldChainReefer; // 3.8°C Monitored
    private String originPackhouse; // Central Packhouse, Ludhiana / Fazilka Hub
    private String primaryTarget; // Ludhiana Wholesale Yard / Azadpur Mandi
    private double totalDispatchWeightKg;
    private double estimatedGrossValueInr;
    private List<Allocation> authorizedBatches;
    private String qrCodePayload;
    private String certifiedOfficer;
}
