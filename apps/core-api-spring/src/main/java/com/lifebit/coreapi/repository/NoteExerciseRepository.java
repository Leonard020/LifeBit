package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.ExerciseSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface NoteExerciseRepository extends JpaRepository<ExerciseSession, Long> {
    List<ExerciseSession> findByUser_UserIdAndExerciseDate(Long userId, LocalDate date);
}