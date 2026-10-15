package com.FreshRoute.controller;

import com.FreshRoute.dto.DestinationStatsDto;
import com.FreshRoute.dto.RouteStatsDto;
import com.FreshRoute.dto.WarehouseStatsDto;
import com.FreshRoute.service.NetworkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/network")
@RequiredArgsConstructor
public class NetworkController {

    private final NetworkService networkService;

    @GetMapping("/warehouses")
    public ResponseEntity<List<WarehouseStatsDto>> getWarehouses() {
        return ResponseEntity.ok(networkService.getWarehouseStats());
    }

    @GetMapping("/destination-stats")
    public ResponseEntity<List<DestinationStatsDto>> getDestinationStats() {
        return ResponseEntity.ok(networkService.getDestinationStats());
    }

    @GetMapping("/routes")
    public ResponseEntity<List<RouteStatsDto>> getRouteStats() {
        return ResponseEntity.ok(networkService.getRouteStats());
    }
}
