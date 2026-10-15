package com.FreshRoute.service;

import com.FreshRoute.dto.DestinationStatsDto;
import com.FreshRoute.dto.RouteStatsDto;
import com.FreshRoute.dto.WarehouseStatsDto;
import com.FreshRoute.model.Allocation;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.PlanResult;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
public class NetworkService {

    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final PlanService planService;

    public List<WarehouseStatsDto> getWarehouseStats() {
        List<Batch> allBatches = batchRepository.findAll();

        Map<String, String> hubNames = Map.of(
                "demo-hub-central", "Synthetic Demo Hub Central",
                "demo-hub-north", "Synthetic Demo Hub North",
                "demo-hub-south", "Synthetic Demo Hub South"
        );

        Map<String, double[]> hubCoords = Map.of(
                "demo-hub-central", new double[]{30.95, 75.85},
                "demo-hub-north", new double[]{31.62, 74.90},
                "demo-hub-south", new double[]{30.35, 76.40}
        );

        Map<String, List<Batch>> byWarehouse = new LinkedHashMap<>();
        byWarehouse.put("demo-hub-central", new ArrayList<>());
        byWarehouse.put("demo-hub-north", new ArrayList<>());
        byWarehouse.put("demo-hub-south", new ArrayList<>());

        for (Batch b : allBatches) {
            String wId = b.getWarehouseId() != null ? b.getWarehouseId() : "demo-hub-central";
            byWarehouse.computeIfAbsent(wId, k -> new ArrayList<>()).add(b);
        }

        List<WarehouseStatsDto> list = new ArrayList<>();
        for (Map.Entry<String, List<Batch>> entry : byWarehouse.entrySet()) {
            String wId = entry.getKey();
            List<Batch> batches = entry.getValue();
            double stock = batches.stream().mapToDouble(Batch::getQuantityKg).sum();
            double[] coords = hubCoords.getOrDefault(wId, new double[]{30.95, 75.85});
            String name = hubNames.getOrDefault(wId, "Packhouse " + wId);

            list.add(WarehouseStatsDto.builder()
                    .id(wId)
                    .name(name)
                    .latitude(coords[0])
                    .longitude(coords[1])
                    .stockKg(Math.round(stock))
                    .batchCount(batches.size())
                    .batches(batches)
                    .build());
        }

        return list;
    }

    public List<DestinationStatsDto> getDestinationStats() {
        List<Destination> destinations = destinationRepository.findAll();
        PlanResult fresh = planService.getLatestPlans().get("freshRoute");
        if (fresh == null) {
            fresh = planService.executeFreshRoutePlan(null);
        }

        Map<String, Double> allocatedByDest = new HashMap<>();
        Map<String, Boolean> violationByDest = new HashMap<>();

        if (fresh != null && fresh.getAllocations() != null) {
            for (Allocation a : fresh.getAllocations()) {
                allocatedByDest.put(a.getDestinationCode(),
                        allocatedByDest.getOrDefault(a.getDestinationCode(), 0.0) + a.getAllocatedQuantityKg());
                if (!Boolean.TRUE.equals(a.getIsFeasible())) {
                    violationByDest.put(a.getDestinationCode(), true);
                }
            }
        }

        List<DestinationStatsDto> list = new ArrayList<>();
        for (Destination d : destinations) {
            double alloc = allocatedByDest.getOrDefault(d.getDestinationCode(), 0.0);
            double remainingDemand = Math.max(0.0, d.getDemandKg() - alloc);
            double capUsedPct = d.getCapacityLimitKg() > 0 ? (alloc / d.getCapacityLimitKg()) * 100.0 : 0.0;
            boolean hasViolation = violationByDest.getOrDefault(d.getDestinationCode(), false);

            list.add(DestinationStatsDto.builder()
                    .destinationCode(d.getDestinationCode())
                    .name(d.getName())
                    .demandKg(d.getDemandKg())
                    .capacityKg(d.getCapacityLimitKg())
                    .allocatedKg(Math.round(alloc))
                    .remainingDemandKg(Math.round(remainingDemand))
                    .capacityUsedPct(Math.round(capUsedPct * 10.0) / 10.0)
                    .hasViolation(hasViolation)
                    .travelHours(d.getTransportTimeHours())
                    .marketPricePerKg(d.getOfferedPricePerKg())
                    .build());
        }

        return list;
    }

    public List<RouteStatsDto> getRouteStats() {
        PlanResult fresh = planService.getLatestPlans().get("freshRoute");
        if (fresh == null) {
            fresh = planService.executeFreshRoutePlan(null);
        }

        Map<String, Batch> batchMap = new HashMap<>();
        for (Batch b : batchRepository.findAll()) {
            batchMap.put(b.getBatchCode(), b);
        }

        Map<String, Destination> destMap = new HashMap<>();
        for (Destination d : destinationRepository.findAll()) {
            destMap.put(d.getDestinationCode(), d);
        }

        Map<String, RouteStatsDto> routeGroups = new LinkedHashMap<>();

        if (fresh != null && fresh.getAllocations() != null) {
            for (Allocation a : fresh.getAllocations()) {
                Batch b = batchMap.get(a.getBatchCode());
                Destination d = destMap.get(a.getDestinationCode());
                String wId = b != null && b.getWarehouseId() != null ? b.getWarehouseId() : "demo-hub-central";
                String wName = "demo-hub-central".equals(wId) ? "Synthetic Demo Hub Central"
                        : ("demo-hub-north".equals(wId) ? "Synthetic Demo Hub North" : "Synthetic Demo Hub South");
                String dCode = a.getDestinationCode();
                String dName = a.getDestinationName();

                String key = wId + ">" + dCode;
                RouteStatsDto existing = routeGroups.get(key);

                double transportCost = a.getAllocatedQuantityKg() * (d != null && d.getTransportCostPerKg() != null ? d.getTransportCostPerKg() : 2.5);
                boolean infeasible = !Boolean.TRUE.equals(a.getIsFeasible());

                if (existing == null) {
                    routeGroups.put(key, RouteStatsDto.builder()
                            .routeKey(key)
                            .warehouseId(wId)
                            .warehouseName(wName)
                            .destinationCode(dCode)
                            .destinationName(dName)
                            .allocatedKg(a.getAllocatedQuantityKg())
                            .infeasible(infeasible)
                            .transitHours(a.getTransportTimeHours() != null ? a.getTransportTimeHours() : 3.0)
                            .transportCostInr(Math.round(transportCost))
                            .build());
                } else {
                    existing.setAllocatedKg(existing.getAllocatedKg() + a.getAllocatedQuantityKg());
                    existing.setTransportCostInr(existing.getTransportCostInr() + Math.round(transportCost));
                    if (infeasible) existing.setInfeasible(true);
                }
            }
        }

        return new ArrayList<>(routeGroups.values());
    }
}
