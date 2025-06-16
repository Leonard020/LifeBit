package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.DietLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;

public interface DietLogRepository extends JpaRepository<DietLog, Long> {
    List<DietLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);

    @Query("SELECT COALESCE(SUM(m.foodItem.calories * m.quantity), 0) FROM MealLog m WHERE m.user.id = :userId AND m.logDate = :date")
    Double sumCaloriesByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.foodItem.carbs * m.quantity), 0) FROM MealLog m WHERE m.user.id = :userId AND m.logDate = :date")
    Double sumCarbsByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.foodItem.protein * m.quantity), 0) FROM MealLog m WHERE m.user.id = :userId AND m.logDate = :date")
    Double sumProteinByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(m.foodItem.fat * m.quantity), 0) FROM MealLog m WHERE m.user.id = :userId AND m.logDate = :date")
    Double sumFatByUserIdAndDate(@Param("userId") Long userId, @Param("date") LocalDate date);
} 