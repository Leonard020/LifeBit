package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.ExerciseSession;
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
public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {
    Optional<ExerciseSession> findByUuid(UUID uuid);
    List<ExerciseSession> findByUserOrderByExerciseDateDesc(User user);
    List<ExerciseSession> findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
        User user, LocalDate startDate, LocalDate endDate);

    // ✅ NoteExerciseService 용
    List<ExerciseSession> findByUser_UserIdAndExerciseDateBetween(Long userId, LocalDate start, LocalDate end);
    @Query("SELECT es FROM ExerciseSession es JOIN FETCH es.user JOIN FETCH es.exerciseCatalog WHERE es.user.userId = :userId AND es.exerciseDate = :date")
    List<ExerciseSession> findByUser_UserIdAndExerciseDateWithCatalog(@Param("userId") Long userId, @Param("date") LocalDate date);

    @Query("SELECT es.exerciseDate as date, COUNT(es) as count FROM ExerciseSession es " +
           "WHERE es.user = :user AND es.exerciseDate BETWEEN :startDate AND :endDate " +
           "GROUP BY es.exerciseDate")
    List<Object[]> findExerciseCountByDateRange(@Param("user") User user, 
                                               @Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);

    @Query("SELECT COUNT(DISTINCT es.exerciseDate) FROM ExerciseSession es WHERE es.user = :user")
    long countDistinctExerciseDateByUser(@Param("user") User user);

    @Query("SELECT es FROM ExerciseSession es JOIN FETCH es.user JOIN FETCH es.exerciseCatalog WHERE es.user.userId = :userId AND es.exerciseDate BETWEEN :start AND :end")
    List<ExerciseSession> findByUser_UserIdAndExerciseDateBetweenWithCatalog(@Param("userId") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);
    
    // 대시보드 통계용 메서드
    @Query("SELECT COUNT(es) FROM ExerciseSession es WHERE es.createdAt BETWEEN :start AND :end")
    long countByDateBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // 기간별 활동 사용자 수 통계용 메서드
    @Query("SELECT COUNT(DISTINCT es.user.userId) FROM ExerciseSession es WHERE es.exerciseDate BETWEEN :startDate AND :endDate")
    long countDistinctUsersByDateBetween(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);
}