package com.FreshRoute.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscountResultDto {
    private List<BatchDiscountRecommendationDto> recommendations;
    private DiscountSummaryDto summary;
}
