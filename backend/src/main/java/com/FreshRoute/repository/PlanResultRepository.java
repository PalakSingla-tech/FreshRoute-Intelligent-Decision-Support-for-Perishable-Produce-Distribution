package com.FreshRoute.repository;

import com.FreshRoute.model.PlanResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanResultRepository extends JpaRepository<PlanResult, Long> {
    List<PlanResult> findByPlanTypeOrderByExecutedAtDesc(String planType);
    Optional<PlanResult> findTopByPlanTypeOrderByExecutedAtDesc(String planType);
}
