package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.DietNutrition;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface DietNutritionRepository extends JpaRepository<DietNutrition, Long> {
    Optional<DietNutrition> findByUserId(Long userId);
} 