package com.FreshRoute.service;

import com.FreshRoute.dto.BatchDecisionAuditDto;
import com.FreshRoute.dto.DestinationFeasibilityAnalysis;
import com.FreshRoute.dto.DiscountRecommendation;
import com.FreshRoute.mapper.ExplainabilityMapper;
import com.FreshRoute.model.Allocation;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import com.FreshRoute.repository.AllocationRepository;
import com.FreshRoute.repository.BatchRepository;
import com.FreshRoute.repository.DestinationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class ExplainabilityService {

    private final AllocationRepository allocationRepository;
    private final BatchRepository batchRepository;
    private final DestinationRepository destinationRepository;
    private final FeasibilityEngine feasibilityEngine;
    private final DiscountEngine discountEngine;
    private final ExplainabilityMapper explainabilityMapper;

    public ExplainabilityService(
            AllocationRepository allocationRepository,
            BatchRepository batchRepository,
            DestinationRepository destinationRepository,
            FeasibilityEngine feasibilityEngine,
            DiscountEngine discountEngine,
            ExplainabilityMapper explainabilityMapper) {
        this.allocationRepository = allocationRepository;
        this.batchRepository = batchRepository;
        this.destinationRepository = destinationRepository;
        this.feasibilityEngine = feasibilityEngine;
        this.discountEngine = discountEngine;
        this.explainabilityMapper = explainabilityMapper;
    }

    public Optional<BatchDecisionAuditDto> auditBatchDecision(String batchCode) {
        Optional<Batch> batchOpt = batchRepository.findByBatchCode(batchCode);
        if (batchOpt.isEmpty()) {
            return Optional.empty();
        }

        Batch batch = batchOpt.get();
        List<Destination> destinations = destinationRepository.findAll();
        List<DestinationFeasibilityAnalysis> analysisList = new ArrayList<>();

        for (Destination d : destinations) {
            FeasibilityCheckResult feasibility = feasibilityEngine.checkFeasibility(batch, d, false);
            double buffer = feasibility.getShelfLifeBufferHours();
            DiscountRecommendation disc = discountEngine.calculateDiscount(buffer, d.getOfferedPricePerKg());

            double freight = d.getTransportCostPerKg() != null ? d.getTransportCostPerKg() : 0.0;
            double handling = d.getHandlingCostPerKg() != null ? d.getHandlingCostPerKg() : 0.0;
            double baseCost = batch.getBaseCostPerKg() != null ? batch.getBaseCostPerKg() : 20.0;
            double projectedMargin = disc.getEffectivePricePerKg() - freight - handling - baseCost;

            String comment = evaluateDecisionComment(feasibility.isFeasible(), buffer);

            analysisList.add(explainabilityMapper.toDestinationFeasibilityAnalysis(
                    d, feasibility, disc, projectedMargin, comment));
        }

        String rationale = String.format(
                "FreshRoute evaluated %s candidate routes for Batch %s (%s). Routes exceeding shelf life (%s hrs) were strictly filtered to prevent transit decay. " +
                        "Selection balances perishable safety buffer with net economic yield after dynamic clearance discount.",
                destinations.size(), batch.getBatchCode(), batch.getCommodity(), batch.getRemainingShelfLifeHours());

        String baselineFlaw = "Baseline FIFO ignores remaining shelf life and only looks at nominal price, sending low shelf-life batches to distant North/South hubs where they spoil on arrival.";

        String discountDisclosed = "Dynamic Discount Assumption: 15% discount for 8-24h buffer accelerates retail offtake by +25%; 30% discount for <8h buffer accelerates offtake by +50%.";

        double remaining = batch.getRemainingShelfLifeHours() != null ? batch.getRemainingShelfLifeHours() : 12.0;
        String riskLevel = remaining < 8.0 ? "High" : (remaining <= 24.0 ? "Medium" : "Low");
        String urgencyTier = "High".equals(riskLevel)
                ? "Immediate Dispatch (< 4h window)"
                : ("Medium".equals(riskLevel) ? "Priority Route (< 12h window)" : "Standard Buffer (> 24h window)");

        String recommendedAction = batch.getRecommendedAction() != null
                ? batch.getRecommendedAction()
                : ("High".equals(riskLevel) ? "Immediate local discount clearance" : "Dispatch to nearest high-absorption mandi");

        String spoilageProbability = "High".equals(riskLevel)
                ? "82% spoilage likelihood within 6 hours under ambient daytime heat (>31°C)"
                : ("Medium".equals(riskLevel)
                ? "38% quality degradation if delayed beyond 16 hours"
                : "Minimal (<5%) spoilage hazard under baseline cold-chain");

        String commodity = batch.getCommodity() != null ? batch.getCommodity().toLowerCase() : "";
        String respirationRate = batch.getRespirationRate() != null
                ? batch.getRespirationRate()
                : (commodity.contains("spinach") || commodity.contains("leaf")
                ? "Very High (45–60 mg CO₂/kg·h · rapid water transpiration)"
                : (commodity.contains("tomato")
                ? "High Climacteric (22–28 mg CO₂/kg·h · ethylene autocatalysis)"
                : (commodity.contains("banana")
                ? "High Ethylene Emission (18–25 mg CO₂/kg·h · peel sugar breakdown)"
                : "Low Basal Respiration (5–8 mg CO₂/kg·h)")));

        String optimumTemp = batch.getOptimumTemp() != null
                ? batch.getOptimumTemp()
                : (commodity.contains("spinach")
                ? "2°C – 4°C with >95% Relative Humidity"
                : (commodity.contains("tomato")
                ? "10°C – 12°C (chilling sensitive below 8°C)"
                : (commodity.contains("banana")
                ? "13°C – 14°C (susceptible to chill browning below 11°C)"
                : "15°C – 20°C (well-ventilated dry ambient)")));

        String corridorHeatFactor = "Daytime ambient (>31°C) accelerates decay velocity 2.4× via Q10 Arrhenius kinetics";
        String q10Factor = "2.35 (Arrhenius temperature-dependent respiration kinetic model)";
        String degradationThreshold = "Produce undergoes irreversible senescent softening if temperature exceeds " + optimumTemp;
        String transitBuffer = "High".equals(riskLevel)
                ? String.format("Tight transit margin: %s hrs remaining vs route transit time", remaining)
                : String.format("Safe transit margin: %s hrs remaining allows standard transit", remaining);

        double basePricePerKg = batch.getReferenceMarketPricePerKg() != null ? batch.getReferenceMarketPricePerKg() : 25.0;
        double markdownPct = "High".equals(riskLevel) ? 25.0 : ("Medium".equals(riskLevel) ? 15.0 : 0.0);
        double effectivePricePerKg = Math.round(basePricePerKg * (1.0 - markdownPct / 100.0) * 100.0) / 100.0;
        double salvageValueInr = Math.round(batch.getQuantityKg() * effectivePricePerKg);
        double lossFraction = "High".equals(riskLevel) ? 0.90 : ("Medium".equals(riskLevel) ? 0.45 : 0.05);
        double potentialLossInr = Math.round(batch.getQuantityKg() * basePricePerKg * lossFraction);

        BatchDecisionAuditDto audit = explainabilityMapper.toBatchDecisionAuditDto(
                batch,
                riskLevel,
                urgencyTier,
                recommendedAction,
                spoilageProbability,
                respirationRate,
                corridorHeatFactor,
                q10Factor,
                optimumTemp,
                degradationThreshold,
                transitBuffer,
                basePricePerKg,
                markdownPct,
                effectivePricePerKg,
                salvageValueInr,
                potentialLossInr,
                analysisList,
                rationale,
                baselineFlaw,
                discountDisclosed);

        return Optional.of(audit);
    }

    private String evaluateDecisionComment(boolean isFeasible, double buffer) {
        if (!isFeasible) {
            return "REJECTED BY FRESHROUTE: Produce arrives spoiled. Would cause 100% loss of stock value and wasted freight.";
        } else if (buffer < 8.0) {
            return "HIGH RISK CANDIDATE: Tight window. Requires 30% discount to guarantee retail clearance.";
        } else if (buffer <= 24.0) {
            return "MODERATE PERISHABILITY: Requires 15% promotional clearance discount for rapid offtake.";
        } else {
            return "SAFE PREMIUM CANDIDATE: Ample shelf life buffer. Captures full mandi rate.";
        }
    }

    public Optional<Allocation> getAllocationExplanation(Long id) {
        return allocationRepository.findById(id);
    }
}
