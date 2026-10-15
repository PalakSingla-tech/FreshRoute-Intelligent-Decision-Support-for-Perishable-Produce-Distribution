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
public class BatchAllocationChangeDto {
    private String batchCode;
    private String commodity;
    private double previousKg;
    private double nextKg;
    private List<SplitDto> previousSplits;
    private List<SplitDto> nextSplits;
    private String reason;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SplitDto {
        private String destinationCode;
        private String destinationName;
        private double quantityKg;
    }
}
