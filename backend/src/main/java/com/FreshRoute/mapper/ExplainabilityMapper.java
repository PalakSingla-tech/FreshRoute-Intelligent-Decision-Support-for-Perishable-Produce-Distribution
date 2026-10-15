package com.FreshRoute.mapper;

import com.FreshRoute.dto.BatchDecisionAuditDto;
import com.FreshRoute.dto.DestinationFeasibilityAnalysis;
import com.FreshRoute.dto.DiscountRecommendation;
import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ExplainabilityMapper {

    public DestinationFeasibilityAnalysis toDestinationFeasibilityAnalysis(
            Destination destination,
            FeasibilityCheckResult feasibility,
            DiscountRecommendation discountRecommendation,
            double projectedMargin,
            String decisionComment) {
        return DestinationFeasibilityAnalysis.builder()
                .destinationCode(destination.getDestinationCode())
                .destinationName(destination.getName())
                .offeredPricePerKg(destination.getOfferedPricePerKg())
                .totalTransitHours(feasibility.getTotalTransitHours())
                .shelfLifeBufferHours(feasibility.getShelfLifeBufferHours())
                .isFeasible(feasibility.isFeasible())
                .feasibilityVerdict(feasibility.getReason())
                .recommendedDiscountPercentage(discountRecommendation.getDiscountPercentage())
                .projectedNetMarginPerKg(Math.round(projectedMargin * 10.0) / 10.0)
                .decisionComment(decisionComment)
                .build();
    }

    public BatchDecisionAuditDto toBatchDecisionAuditDto(
            Batch batch,
            String riskLevel,
            String urgencyTier,
            String recommendedAction,
            String spoilageProbability,
            String respirationRate,
            String corridorHeatFactor,
            String q10Factor,
            String optimumTemp,
            String degradationThreshold,
            String transitBuffer,
            double basePricePerKg,
            double markdownPct,
            double effectivePricePerKg,
            double salvageValueInr,
            double potentialLossInr,
            List<DestinationFeasibilityAnalysis> candidateRoutes,
            String rationale,
            String baselineBlindSpotExplanation,
            String pricingAndDiscountRuleDisclosed) {
        return BatchDecisionAuditDto.builder()
                .batchCode(batch.getBatchCode())
                .commodity(batch.getCommodity())
                .emoji(batch.getEmoji())
                .warehouseId(batch.getWarehouseId())
                .quantityKg(batch.getQuantityKg())
                .remainingShelfLifeHours(batch.getRemainingShelfLifeHours())
                .riskLevel(riskLevel)
                .urgencyTier(urgencyTier)
                .recommendedAction(recommendedAction)
                .spoilageProbability(spoilageProbability)
                .respirationRate(respirationRate)
                .corridorHeatFactor(corridorHeatFactor)
                .q10Factor(q10Factor)
                .optimumTemp(optimumTemp)
                .degradationThreshold(degradationThreshold)
                .transitBuffer(transitBuffer)
                .basePricePerKg(basePricePerKg)
                .markdownPct(markdownPct)
                .effectivePricePerKg(effectivePricePerKg)
                .salvageValueInr(salvageValueInr)
                .potentialLossInr(potentialLossInr)
                .candidateRoutes(candidateRoutes)
                .finalRecommendationRationale(rationale)
                .baselineBlindSpotExplanation(baselineBlindSpotExplanation)
                .pricingAndDiscountRuleDisclosed(pricingAndDiscountRuleDisclosed)
                .build();
    }
}
