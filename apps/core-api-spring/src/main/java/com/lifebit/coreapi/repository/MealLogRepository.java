package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealLogRepository extends JpaRepository<MealLog, Long> {
    Optional<MealLog> findByUuid(UUID uuid);
    List<MealLog> findByUserOrderByLogDateDesc(User user);
    List<MealLog> findByUserAndLogDateBetweenOrderByLogDateDesc(
        User user, LocalDate startDate, LocalDate endDate);
    List<MealLog> findByUserAndLogDateOrderByLogDateDescCreatedAtDesc(User user, LocalDate logDate);
    
    @Query("SELECT ml FROM MealLog ml WHERE ml.user = :user AND ml.logDate = :logDate ORDER BY ml.logDate DESC, ml.createdAt DESC")
    List<MealLog> findDailyMealLogs(@Param("user") User user, @Param("logDate") LocalDate logDate);
    
    @Query("SELECT ml.logDate as date, COUNT(ml) as count FROM MealLog ml " +
           "WHERE ml.user = :user AND ml.logDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ml.logDate")
    List<Object[]> findDietCountByDateRange(@Param("user") User user, 
                                           @Param("startDate") LocalDate startDate, 
                                           @Param("endDate") LocalDate endDate);
    
    @Query("SELECT ml FROM MealLog ml WHERE ml.user.userId = :userId AND ml.logDate = :logDate ORDER BY ml.logDate DESC, ml.createdAt DESC")
    List<MealLog> findByUserIdAndLogDateOrderByLogDateDescCreatedAtDesc(@Param("userId") Long userId, @Param("logDate") LocalDate logDate);
} 