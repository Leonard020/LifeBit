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
    
    // 애널리틱스용 추가 메서드들
    @Query("SELECT COUNT(DISTINCT es.user.userId) FROM ExerciseSession es WHERE es.createdAt BETWEEN :start AND :end")
    Long countDistinctUsersInPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT ec.bodyPart, COUNT(DISTINCT es.user.userId) FROM ExerciseSession es " +
           "JOIN es.exerciseCatalog ec WHERE es.createdAt BETWEEN :start AND :end " +
           "GROUP BY ec.bodyPart")
    List<Object[]> countByBodyPartAndDateBetween(@Param("start") LocalDateTime start, 
                                                 @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(es) FROM ExerciseSession es WHERE es.createdAt BETWEEN :start AND :end")
    Long countExerciseSessionsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 누적형 업적: 유저별 검증된 운동 기록 카운트
    @Query("SELECT COUNT(es) FROM ExerciseSession es WHERE es.user.userId = :userId AND es.validationStatus = 'VALIDATED'")
    long countValidatedWorkoutsByUserId(@Param("userId") Long userId);

    // 연속형 업적: 유저별 검증된 운동 기록 날짜 목록
    @Query("SELECT DISTINCT es.exerciseDate FROM ExerciseSession es WHERE es.user.userId = :userId AND es.validationStatus = 'VALIDATED' ORDER BY es.exerciseDate ASC")
    List<LocalDate> findValidatedExerciseDatesByUserId(@Param("userId") Long userId);

    // 특정 요일/시간대 업적: 아침 운동
    @Query("SELECT COUNT(es) FROM ExerciseSession es WHERE es.user.userId = :userId AND es.timePeriod = 'MORNING' AND es.validationStatus = 'VALIDATED'")
    long countMorningWorkoutsByUserId(@Param("userId") Long userId);

    // 특정 요일/시간대 업적: 저녁 운동
    @Query("SELECT COUNT(es) FROM ExerciseSession es WHERE es.user.userId = :userId AND es.timePeriod = 'NIGHT' AND es.validationStatus = 'VALIDATED'")
    long countNightWorkoutsByUserId(@Param("userId") Long userId);

    // 특정 요일/시간대 업적: 주말 운동 (토: 6, 일: 7, PostgreSQL 기준)
    @Query(value = "SELECT COUNT(*) FROM exercise_sessions es WHERE es.user_id = :userId AND EXTRACT(ISODOW FROM es.exercise_date) IN (6, 7) AND es.validation_status = 'VALIDATED'", nativeQuery = true)
    long countWeekendWorkoutsByUserId(@Param("userId") Long userId);

    // 특정 값 도달 업적: 누적 칼로리 소모
    @Query("SELECT COALESCE(SUM(es.caloriesBurned), 0) FROM ExerciseSession es WHERE es.user.userId = :userId AND es.validationStatus = 'VALIDATED'")
    int sumTotalCaloriesBurnedByUserId(@Param("userId") Long userId);

    // 특정 값 도달 업적: 총 운동 시간(분)
    @Query("SELECT COALESCE(SUM(es.durationMinutes), 0) FROM ExerciseSession es WHERE es.user.userId = :userId AND es.validationStatus = 'VALIDATED'")
    int sumTotalWorkoutMinutesByUserId(@Param("userId") Long userId);
}