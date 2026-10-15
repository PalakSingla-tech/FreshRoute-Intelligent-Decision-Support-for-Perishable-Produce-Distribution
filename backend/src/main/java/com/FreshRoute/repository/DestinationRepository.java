package com.FreshRoute.repository;

import com.FreshRoute.model.Destination;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DestinationRepository extends JpaRepository<Destination, Long> {
    Optional<Destination> findByDestinationCode(String destinationCode);
    List<Destination> findByActiveTrue();
}
