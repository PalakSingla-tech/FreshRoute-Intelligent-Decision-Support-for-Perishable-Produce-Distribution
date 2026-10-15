package com.FreshRoute.mapper;

import com.FreshRoute.model.Batch;
import org.springframework.stereotype.Component;

@Component
public class BatchMapper {

    public void updateEntity(Batch target, Batch source) {
        if (target == null || source == null) {
            return;
        }

        target.setCommodity(source.getCommodity());
        target.setQuantityKg(source.getQuantityKg());
        target.setRemainingShelfLifeHours(source.getRemainingShelfLifeHours());
        target.setShelfLifeMinHours(source.getShelfLifeMinHours());
        target.setShelfLifeMaxHours(source.getShelfLifeMaxHours());
        target.setBaseCostPerKg(source.getBaseCostPerKg());
        target.setReferenceMarketPricePerKg(source.getReferenceMarketPricePerKg());
        target.setStorageCondition(source.getStorageCondition());
        target.setStorageTempC(source.getStorageTempC());
        target.setPerishabilityFactor(source.getPerishabilityFactor());
        target.setOriginLocation(source.getOriginLocation());
        target.setNotes(source.getNotes());
    }
}
