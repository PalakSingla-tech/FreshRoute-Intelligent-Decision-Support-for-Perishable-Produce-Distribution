package com.FreshRoute.service;

import com.FreshRoute.dto.RouteDisruptionDto;
import com.FreshRoute.mapper.DestinationMapper;
import com.FreshRoute.model.Destination;
import com.FreshRoute.repository.DestinationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class DestinationService {

    private final DestinationRepository destinationRepository;
    private final DestinationMapper destinationMapper;

    public DestinationService(
            DestinationRepository destinationRepository,
            DestinationMapper destinationMapper) {
        this.destinationRepository = destinationRepository;
        this.destinationMapper = destinationMapper;
    }

    public List<Destination> getAllDestinations() {
        return destinationRepository.findAll();
    }

    public Optional<Destination> getDestinationById(Long id) {
        return destinationRepository.findById(id);
    }

    public Optional<Destination> getDestinationByCodeOrId(String codeOrId) {
        try {
            Long id = Long.parseLong(codeOrId);
            Optional<Destination> byId = destinationRepository.findById(id);
            if (byId.isPresent()) return byId;
        } catch (NumberFormatException ignored) {}
        return destinationRepository.findByDestinationCode(codeOrId);
    }

    @Transactional
    public Optional<Destination> updateDestination(Long id, Destination updated) {
        return destinationRepository.findById(id)
                .map(dest -> {
                    destinationMapper.updateEntity(dest, updated);
                    return destinationRepository.save(dest);
                });
    }

    @Transactional
    public Optional<Destination> disruptRoute(Long id, RouteDisruptionDto disruption) {
        return destinationRepository.findById(id)
                .map(dest -> {
                    destinationMapper.applyDisruption(dest, disruption);
                    return destinationRepository.save(dest);
                });
    }

    @Transactional
    public Optional<Destination> disruptRoute(Long id, Map<String, Object> disruption) {
        return destinationRepository.findById(id)
                .map(dest -> {
                    destinationMapper.applyDisruption(dest, disruption);
                    return destinationRepository.save(dest);
                });
    }
}
