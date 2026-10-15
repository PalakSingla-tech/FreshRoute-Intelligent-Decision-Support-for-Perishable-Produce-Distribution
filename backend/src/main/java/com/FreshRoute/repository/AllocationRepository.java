package com.FreshRoute.repository;

import com.FreshRoute.model.Allocation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {
    List<Allocation> findByBatchCode(String batchCode);
    List<Allocation> findByDestinationCode(String destinationCode);
}
