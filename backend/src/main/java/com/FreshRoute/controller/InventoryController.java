package com.FreshRoute.controller;

import com.FreshRoute.model.Batch;
import com.FreshRoute.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<Batch>> getAllBatches(
            @RequestParam(required = false) String warehouseId,
            @RequestParam(required = false) String commodity,
            @RequestParam(required = false) String risk) {
        if (warehouseId != null || commodity != null || risk != null) {
            return ResponseEntity.ok(inventoryService.getFilteredBatches(warehouseId, commodity, risk));
        }
        return ResponseEntity.ok(inventoryService.getAllBatches());
    }

    @GetMapping("/{codeOrId}")
    public ResponseEntity<Batch> getBatchById(@PathVariable String codeOrId) {
        return inventoryService.getBatchByCodeOrId(codeOrId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Batch> createBatch(@RequestBody Batch batch) {
        Batch saved = inventoryService.createBatch(batch);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Batch> updateBatch(@PathVariable Long id, @RequestBody Batch updated) {
        return inventoryService.updateBatch(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        if (inventoryService.deleteBatch(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/reset")
    public ResponseEntity<String> resetInventory() {
        inventoryService.resetInventory();
        return ResponseEntity.ok("Inventory and destinations reset successfully to MoFPI dataset.");
    }
}
