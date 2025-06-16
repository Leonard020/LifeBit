package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.FoodItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface FoodItemRepository extends JpaRepository<FoodItem, Long> {
    Optional<FoodItem> findByUuid(UUID uuid);
    Optional<FoodItem> findByFoodCode(String foodCode);
    List<FoodItem> findByNameContainingIgnoreCase(String name);
} 