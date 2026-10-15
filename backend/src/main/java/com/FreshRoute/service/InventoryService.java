package com.FreshRoute.service;

import com.FreshRoute.mapper.BatchMapper;
import com.FreshRoute.model.Batch;
import com.FreshRoute.repository.BatchRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class InventoryService {

    private final BatchRepository batchRepository;
    private final DataInitializerService dataInitializerService;
    private final BatchMapper batchMapper;

    public InventoryService(
            BatchRepository batchRepository,
            DataInitializerService dataInitializerService,
            BatchMapper batchMapper) {
        this.batchRepository = batchRepository;
        this.dataInitializerService = dataInitializerService;
        this.batchMapper = batchMapper;
    }

    public List<Batch> getAllBatches() {
        return batchRepository.findAll();
    }

    public List<Batch> getFilteredBatches(String warehouseId, String commodity, String risk) {
        List<Batch> batches = batchRepository.findAll();
        return batches.stream()
                .filter(b -> warehouseId == null || warehouseId.equalsIgnoreCase(b.getWarehouseId()))
                .filter(b -> commodity == null || (b.getCommodity() != null && b.getCommodity().toLowerCase().contains(commodity.toLowerCase())))
                .filter(b -> {
                    if (risk == null) return true;
                    double rem = b.getRemainingShelfLifeHours() != null ? b.getRemainingShelfLifeHours() : 12.0;
                    String bRisk = rem < 8.0 ? "High" : (rem <= 24.0 ? "Medium" : "Low");
                    return risk.equalsIgnoreCase(bRisk);
                })
                .toList();
    }

    public Optional<Batch> getBatchById(Long id) {
        return batchRepository.findById(id);
    }

    public Optional<Batch> getBatchByCodeOrId(String codeOrId) {
        try {
            Long id = Long.parseLong(codeOrId);
            Optional<Batch> byId = batchRepository.findById(id);
            if (byId.isPresent()) return byId;
        } catch (NumberFormatException ignored) {}
        return batchRepository.findByBatchCode(codeOrId);
    }

    @Transactional
    public Batch createBatch(Batch batch) {
        if (batch.getBatchCode() == null || batch.getBatchCode().trim().isEmpty()) {
            batch.setBatchCode("B-" + System.currentTimeMillis() % 10000);
        }
        if (batch.getHarvestTimestamp() == null) {
            batch.setHarvestTimestamp(LocalDateTime.now());
        }
        return batchRepository.save(batch);
    }

    @Transactional
    public Optional<Batch> updateBatch(Long id, Batch updated) {
        return batchRepository.findById(id)
                .map(batch -> {
                    batchMapper.updateEntity(batch, updated);
                    return batchRepository.save(batch);
                });
    }

    @Transactional
    public boolean deleteBatch(Long id) {
        if (batchRepository.existsById(id)) {
            batchRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional
    public void resetInventory() {
        dataInitializerService.seedData();
    }
}
