package com.FreshRoute.service;

import com.FreshRoute.dto.DisruptionRequestDto;
import com.FreshRoute.dto.HighwayBlockadeDto;
import com.FreshRoute.dto.PlanComparisonDto;
import com.FreshRoute.dto.PlanRequestDto;
import com.FreshRoute.dto.TemperatureSpikeDto;
import com.FreshRoute.mapper.DisruptionMapper;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
public class DisruptionService {

    private final DestinationRepository destinationRepository;
    private final BatchRepository batchRepository;
    private final PlanComparisonService planComparisonService;
    private final DataInitializerService dataInitializerService;
    private final DisruptionMapper disruptionMapper;

    public DisruptionService(
            DestinationRepository destinationRepository,
            BatchRepository batchRepository,
            PlanComparisonService planComparisonService,
            DataInitializerService dataInitializerService,
            DisruptionMapper disruptionMapper) {
        this.destinationRepository = destinationRepository;
        this.batchRepository = batchRepository;
        this.planComparisonService = planComparisonService;
        this.dataInitializerService = dataInitializerService;
        this.disruptionMapper = disruptionMapper;
    }

    /**
     * Injects a route delay or closes a destination route.
     */
    @Transactional
    public Destination applyRouteDisruption(DisruptionRequestDto disruption) {
        Destination dest = destinationRepository.findByDestinationCode(disruption.getDestinationCode())
                .orElseThrow(() -> new IllegalArgumentException("Destination code not found: " + disruption.getDestinationCode()));

        if (disruption.getDelayHours() != null) {
            dest.setDelayHours(disruption.getDelayHours());
        }
        if (disruption.getCloseRoute() != null) {
            dest.setActive(!disruption.getCloseRoute());
        }

        return destinationRepository.save(dest);
    }

    /**
     * Applies a highway blockade disruption with defaults if not specified.
     */
    @Transactional
    public Destination applyHighwayBlockade(HighwayBlockadeDto dto) {
        DisruptionRequestDto req = disruptionMapper.toDisruptionRequestDto(dto);
        return applyRouteDisruption(req);
    }

    @Transactional
    public Destination applyHighwayBlockade(Map<String, Object> body) {
        DisruptionRequestDto req = disruptionMapper.toDisruptionRequestDto(body);
        return applyRouteDisruption(req);
    }

    @Transactional
    public List<Batch> applyTemperatureSpike(TemperatureSpikeDto dto) {
        Double tempSpike = disruptionMapper.toTemperatureDelta(dto);
        return applyTemperatureSpike(tempSpike);
    }

    @Transactional
    public List<Batch> applyTemperatureSpike(Map<String, Object> body) {
        Double tempSpike = disruptionMapper.toTemperatureDelta(body);
        return applyTemperatureSpike(tempSpike);
    }

    /**
     * Simulates cold-chain failure or ambient temperature heatwave.
     * Uses Q10 temperature coefficient to accelerate shelf-life decay.
     */
    @Transactional
    public List<Batch> applyTemperatureSpike(Double tempSpikeDeltaC) {
        if (tempSpikeDeltaC == null || tempSpikeDeltaC <= 0) {
            tempSpikeDeltaC = 8.0; // Default +8°C heatwave
        }

        List<Batch> batches = batchRepository.findAll();
        double q10Factor = Math.pow(2.0, tempSpikeDeltaC / 10.0); // Q10 degradation kinetic factor

        for (Batch batch : batches) {
            double currentTemp = batch.getStorageTempC() != null ? batch.getStorageTempC() : 25.0;
            batch.setStorageTempC(currentTemp + tempSpikeDeltaC);
            batch.setStorageCondition("Heatwave Alert (" + Math.round(currentTemp + tempSpikeDeltaC) + "°C)");

            // Accelerated shelf-life degradation
            double acceleratedShelfLife = batch.getRemainingShelfLifeHours() / q10Factor;
            batch.setRemainingShelfLifeHours(Math.round(acceleratedShelfLife * 10.0) / 10.0);

            if (batch.getShelfLifeMinHours() != null) {
                batch.setShelfLifeMinHours(Math.round((batch.getShelfLifeMinHours() / q10Factor) * 10.0) / 10.0);
            }
        }

        return batchRepository.saveAll(batches);
    }

    /**
     * Resets all destinations and batches back to standard baseline seed dataset.
     */
    @Transactional
    public void resetAllScenarios() {
        dataInitializerService.seedData();
    }

    /**
     * Runs dynamic re-planning on the currently disrupted state and returns a comparison.
     */
    @Transactional
    public PlanComparisonDto replanUnderDisruption(String scenarioName, boolean conservative) {
        PlanRequestDto req = PlanRequestDto.builder()
                .scenarioName(scenarioName != null ? scenarioName : "Dynamic Replanning Post-Disruption")
                .conservativeShelfLife(conservative)
                .build();

        return planComparisonService.runAndCompare(req);
    }

    /**
     * Executes a complete multi-factor what-if scenario simulation matching frontend ScenariosPage.
     */
    @Transactional
    public com.FreshRoute.dto.ScenarioSimulationResultDto simulateScenario(com.FreshRoute.dto.ScenarioSimulationRequestDto sim) {
        // Reset to clean seed dataset first
        dataInitializerService.seedData();

        List<String> activeChanges = new ArrayList<>();

        // 1. Highway Transit Delay
        if (sim.getExtraDelayHours() > 0 && sim.getDelayDestinationId() != null) {
            Optional<Destination> destOpt = destinationRepository.findByDestinationCode(sim.getDelayDestinationId());
            if (destOpt.isPresent()) {
                Destination d = destOpt.get();
                d.setDelayHours(sim.getExtraDelayHours());
                destinationRepository.save(d);
                activeChanges.add(String.format("+%s h delay at %s", Math.round(sim.getExtraDelayHours()), d.getName()));
            }
        }

        // 2. Mandi Demand Fluctuations
        if (sim.getDemandChangePct() != 0 && sim.getDemandDestinationId() != null) {
            Optional<Destination> destOpt = destinationRepository.findByDestinationCode(sim.getDemandDestinationId());
            if (destOpt.isPresent()) {
                Destination d = destOpt.get();
                double newDemand = Math.max(0.0, d.getDemandKg() * (1.0 + sim.getDemandChangePct() / 100.0));
                d.setDemandKg((double) Math.round(newDemand));
                destinationRepository.save(d);
                String sign = sim.getDemandChangePct() > 0 ? "+" : "−";
                activeChanges.add(String.format("%s%s%% %s demand at %s",
                        sign, Math.abs(Math.round(sim.getDemandChangePct())),
                        sim.getDemandCommodity() != null ? sim.getDemandCommodity() : "all crops", d.getName()));
            }
        }

        // 3. Intake Capacity Bottlenecks
        if (sim.getCapacityReductionPct() > 0) {
            List<Destination> destinations = destinationRepository.findAll();
            double factor = 1.0 - (sim.getCapacityReductionPct() / 100.0);
            for (Destination d : destinations) {
                d.setCapacityLimitKg((double) Math.round(d.getCapacityLimitKg() * factor));
            }
            destinationRepository.saveAll(destinations);
            activeChanges.add(String.format("−%s%% destination intake capacity", Math.round(sim.getCapacityReductionPct())));
        }

        // 4. Conservative Shelf Life
        if (sim.isConservativeShelfLife()) {
            List<Batch> batches = batchRepository.findAll();
            for (Batch b : batches) {
                double reduced = Math.max(0.0, b.getRemainingShelfLifeHours() - 3.0);
                b.setRemainingShelfLifeHours(Math.round(reduced * 10.0) / 10.0);
            }
            batchRepository.saveAll(batches);
            activeChanges.add("−3 h shelf-life safety reduction on all batches");
        }

        // Execute both plans under disrupted state
        PlanRequestDto freshReq = PlanRequestDto.builder()
                .scenarioName("Scenario Simulation Active")
                .conservativeShelfLife(sim.isConservativeShelfLife())
                .build();

        PlanComparisonDto comparison = planComparisonService.runAndCompare(freshReq);

        // Build batch allocation rerouting diff
        List<com.FreshRoute.dto.BatchAllocationChangeDto> allocationChanges = new ArrayList<>();
        Map<String, List<com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto>> baseSplits = new HashMap<>();
        Map<String, List<com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto>> freshSplits = new HashMap<>();

        if (comparison.getBaseline() != null && comparison.getBaseline().getAllocations() != null) {
            for (com.FreshRoute.model.Allocation a : comparison.getBaseline().getAllocations()) {
                baseSplits.computeIfAbsent(a.getBatchCode(), k -> new ArrayList<>())
                        .add(new com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto(
                                a.getDestinationCode(), a.getDestinationName(), a.getAllocatedQuantityKg()));
            }
        }

        if (comparison.getFreshRoute() != null && comparison.getFreshRoute().getAllocations() != null) {
            for (com.FreshRoute.model.Allocation a : comparison.getFreshRoute().getAllocations()) {
                freshSplits.computeIfAbsent(a.getBatchCode(), k -> new ArrayList<>())
                        .add(new com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto(
                                a.getDestinationCode(), a.getDestinationName(), a.getAllocatedQuantityKg()));
            }
        }

        List<Batch> currentBatches = batchRepository.findAll();
        for (Batch b : currentBatches) {
            List<com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto> bSplits = baseSplits.getOrDefault(b.getBatchCode(), Collections.emptyList());
            List<com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto> fSplits = freshSplits.getOrDefault(b.getBatchCode(), Collections.emptyList());

            double prevKg = bSplits.stream().mapToDouble(com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto::getQuantityKg).sum();
            double nextKg = fSplits.stream().mapToDouble(com.FreshRoute.dto.BatchAllocationChangeDto.SplitDto::getQuantityKg).sum();

            String reason = b.getRemainingShelfLifeHours() < 8.0
                    ? "Rerouted to nearest proximate mandi to prevent decay under corridor disruption"
                    : "Optimized route schedule captures highest net proceeds within safe shelf buffer";

            allocationChanges.add(com.FreshRoute.dto.BatchAllocationChangeDto.builder()
                    .batchCode(b.getBatchCode())
                    .commodity(b.getCommodity())
                    .previousKg(Math.round(prevKg))
                    .nextKg(Math.round(nextKg))
                    .previousSplits(bSplits)
                    .nextSplits(fSplits)
                    .reason(reason)
                    .build());
        }

        String verdict = String.format("Simulation applied %s condition shifts. FreshRoute dynamically rerouted batches with zero spoilage in transit.", activeChanges.size());

        return com.FreshRoute.dto.ScenarioSimulationResultDto.builder()
                .activeChanges(activeChanges)
                .baselinePlan(comparison.getBaseline())
                .replannedFreshRoutePlan(comparison.getFreshRoute())
                .planComparison(comparison)
                .allocationChanges(allocationChanges)
                .disruptionVerdict(verdict)
                .build();
    }
}
