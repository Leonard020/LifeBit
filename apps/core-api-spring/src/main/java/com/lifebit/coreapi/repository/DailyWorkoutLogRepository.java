package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.DailyWorkoutLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyWorkoutLogRepository extends JpaRepository<DailyWorkoutLog, Long> {
    List<DailyWorkoutLog> findByWorkoutDateAndUserId(LocalDate workoutDate, Long userId);
    List<DailyWorkoutLog> findByUserIdAndWorkoutDateBetween(Long userId, LocalDate start, LocalDate end);
}

