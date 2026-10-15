package com.FreshRoute.controller;

import com.FreshRoute.model.Destination;
import com.FreshRoute.service.DestinationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/destinations")
@RequiredArgsConstructor
public class DestinationController {

    private final DestinationService destinationService;

    @GetMapping
    public ResponseEntity<List<Destination>> getAllDestinations() {
        return ResponseEntity.ok(destinationService.getAllDestinations());
    }

    @GetMapping("/{codeOrId}")
    public ResponseEntity<Destination> getDestinationById(@PathVariable String codeOrId) {
        return destinationService.getDestinationByCodeOrId(codeOrId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Destination> updateDestination(@PathVariable Long id, @RequestBody Destination updated) {
        return destinationService.updateDestination(id, updated)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{id}/disrupt")
    public ResponseEntity<Destination> disruptRoute(
            @PathVariable Long id,
            @RequestBody Map<String, Object> disruption) {
        return destinationService.disruptRoute(id, disruption)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
