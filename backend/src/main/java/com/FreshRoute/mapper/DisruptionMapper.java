package com.FreshRoute.mapper;

import com.FreshRoute.dto.DisruptionRequestDto;
import com.FreshRoute.dto.HighwayBlockadeDto;
import com.FreshRoute.dto.TemperatureSpikeDto;
import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class DisruptionMapper {

    public DisruptionRequestDto toDisruptionRequestDto(HighwayBlockadeDto dto) {
        String destCode = (dto != null && dto.getDestinationCode() != null && !dto.getDestinationCode().trim().isEmpty())
                ? dto.getDestinationCode()
                : "DEST-DELHI";
        double delayHours = (dto != null && dto.getDelayHours() != null)
                ? dto.getDelayHours()
                : 12.0;
        String scenarioName = (dto != null && dto.getScenarioName() != null)
                ? dto.getScenarioName()
                : "Highway NH48 Major Transit Delay";

        return DisruptionRequestDto.builder()
                .destinationCode(destCode)
                .delayHours(delayHours)
                .scenarioName(scenarioName)
                .build();
    }

    public DisruptionRequestDto toDisruptionRequestDto(Map<String, Object> body) {
        String destCode = body != null && body.containsKey("destinationCode") && body.get("destinationCode") != null
                ? body.get("destinationCode").toString()
                : "DEST-DELHI";
        double delayHours = body != null && body.containsKey("delayHours") && body.get("delayHours") != null
                ? Double.parseDouble(body.get("delayHours").toString())
                : 12.0;

        return DisruptionRequestDto.builder()
                .destinationCode(destCode)
                .delayHours(delayHours)
                .scenarioName("Highway NH48 Major Transit Delay")
                .build();
    }

    public Double toTemperatureDelta(TemperatureSpikeDto dto) {
        if (dto != null && dto.getTemperatureDeltaC() != null) {
            return dto.getTemperatureDeltaC();
        }
        return 8.0;
    }

    public Double toTemperatureDelta(Map<String, Object> body) {
        if (body != null && body.containsKey("temperatureDeltaC") && body.get("temperatureDeltaC") != null) {
            return Double.parseDouble(body.get("temperatureDeltaC").toString());
        }
        return 8.0;
    }
}
