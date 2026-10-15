package com.FreshRoute.service;

import com.FreshRoute.model.Batch;
import com.FreshRoute.model.Destination;
import com.FreshRoute.model.FeasibilityCheckResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class FeasibilityEngine {

    /**
     * Checks if a batch can feasibly be dispatched to a destination.
     * Constraint: transport_time + delay + handling_time <= remaining_shelf_life
     */
    public FeasibilityCheckResult checkFeasibility(Batch batch, Destination destination, boolean conservative) {
        if (destination.getActive() != null && !destination.getActive()) {
            return new FeasibilityCheckResult(false, 0.0, 0.0,
                    "Destination route is currently closed/blocked due to disruption.");
        }

        double transportTime = destination.getTransportTimeHours() != null ? destination.getTransportTimeHours() : 0.0;
        double delay = destination.getDelayHours() != null ? destination.getDelayHours() : 0.0;
        double handlingTime = destination.getHandlingTimeHours() != null ? destination.getHandlingTimeHours() : 0.0;
        double totalTransitHours = transportTime + delay + handlingTime;

        double effectiveShelfLife = batch.getEffectiveShelfLife(conservative);
        double buffer = effectiveShelfLife - totalTransitHours;

        if (buffer < 0) {
            String explanation = String.format(
                    "Infeasible: Total transit & handling (%s hrs) exceeds remaining shelf life (%s hrs). Arrives spoiled by %s hrs.",
                    round(totalTransitHours), round(effectiveShelfLife), round(Math.abs(buffer)));
            return new FeasibilityCheckResult(false, totalTransitHours, buffer, explanation);
        }

        String explanation = String.format(
                "Feasible: Total transit (%s hrs) safely fits within shelf life (%s hrs) with %s hrs headroom buffer.",
                round(totalTransitHours), round(effectiveShelfLife), round(buffer));
        return new FeasibilityCheckResult(true, totalTransitHours, buffer, explanation);
    }

    private double round(double val) {
        return Math.round(val * 10.0) / 10.0;
    }
}
