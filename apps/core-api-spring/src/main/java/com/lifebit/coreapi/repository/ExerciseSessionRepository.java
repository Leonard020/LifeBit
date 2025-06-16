package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
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
} 