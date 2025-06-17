package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.ExerciseSession;
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
public interface ExerciseSessionRepository extends JpaRepository<ExerciseSession, Long> {
    Optional<ExerciseSession> findByUuid(UUID uuid);
    List<ExerciseSession> findByUserOrderByExerciseDateDesc(User user);
    List<ExerciseSession> findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
        User user, LocalDate startDate, LocalDate endDate);

    @Query("SELECT es.exerciseDate as date, COUNT(es) as count FROM ExerciseSession es " +
           "WHERE es.user = :user AND es.exerciseDate BETWEEN :startDate AND :endDate " +
           "GROUP BY es.exerciseDate")
    List<Object[]> findExerciseCountByDateRange(@Param("user") User user, 
                                               @Param("startDate") LocalDate startDate, 
                                               @Param("endDate") LocalDate endDate);
} 