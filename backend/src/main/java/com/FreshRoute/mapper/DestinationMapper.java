package com.FreshRoute.mapper;

import com.FreshRoute.dto.RouteDisruptionDto;
import com.FreshRoute.model.Destination;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DestinationMapper {

    public void updateEntity(Destination target, Destination source) {
        if (target == null || source == null) {
            return;
        }

        target.setName(source.getName());
        target.setDemandKg(source.getDemandKg());
        target.setOfferedPricePerKg(source.getOfferedPricePerKg());
        target.setTransportTimeHours(source.getTransportTimeHours());
        target.setTransportCostPerKg(source.getTransportCostPerKg());
        target.setHandlingTimeHours(source.getHandlingTimeHours());
        target.setHandlingCostPerKg(source.getHandlingCostPerKg());
        target.setCapacityLimitKg(source.getCapacityLimitKg());
        target.setActive(source.getActive());
        target.setDelayHours(source.getDelayHours());
        target.setDemandUrgencyWeight(source.getDemandUrgencyWeight());
    }

    public void applyDisruption(Destination target, RouteDisruptionDto disruption) {
        if (target == null || disruption == null) {
            return;
        }

        if (disruption.getDelayHours() != null) {
            target.setDelayHours(disruption.getDelayHours());
        }
        if (disruption.getActive() != null) {
            target.setActive(disruption.getActive());
        }
    }

    public void applyDisruption(Destination target, Map<String, Object> disruption) {
        if (target == null || disruption == null) {
            return;
        }

        if (disruption.containsKey("delayHours") && disruption.get("delayHours") != null) {
            target.setDelayHours(Double.parseDouble(disruption.get("delayHours").toString()));
        }
        if (disruption.containsKey("active") && disruption.get("active") != null) {
            target.setActive(Boolean.parseBoolean(disruption.get("active").toString()));
        }
    }
}
