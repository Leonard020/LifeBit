package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
    
    @Query("SELECT ml FROM MealLog ml WHERE ml.user.userId = :userId AND ml.logDate BETWEEN :startDate AND :endDate ORDER BY ml.logDate DESC, ml.createdAt DESC")
    List<MealLog> findByUserIdAndLogDateBetweenOrderByLogDateDescCreatedAtDesc(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // 대시보드 통계용 메서드
    @Query("SELECT COUNT(ml) FROM MealLog ml WHERE ml.createdAt BETWEEN :start AND :end")
    long countByDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // 기간별 활동 사용자 수 통계용 메서드
    @Query("SELECT COUNT(DISTINCT ml.user.userId) FROM MealLog ml WHERE ml.logDate BETWEEN :startDate AND :endDate")
    long countDistinctUsersByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
    
    // 애널리틱스용 추가 메서드들
    @Query("SELECT COUNT(DISTINCT ml.user.userId) FROM MealLog ml WHERE ml.createdAt BETWEEN :start AND :end")
    Long countDistinctUsersInPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT ml.mealTime, COUNT(ml) FROM MealLog ml WHERE ml.createdAt BETWEEN :start AND :end " +
           "GROUP BY ml.mealTime")
    List<Object[]> countByMealTimeAndDateBetween(@Param("start") LocalDateTime start, 
                                                @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(ml) FROM MealLog ml WHERE ml.createdAt BETWEEN :start AND :end")
    Long countMealLogsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
} 