package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ExerciseService {
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseCatalogRepository exerciseCatalogRepository;

    @Transactional
    public ExerciseSession recordExercise(Long userId, Long catalogId, Integer durationMinutes, 
                                        Integer caloriesBurned, String notes) {
        ExerciseCatalog catalog = exerciseCatalogRepository.findById(catalogId)
            .orElseThrow(() -> new EntityNotFoundException("Exercise catalog not found"));

        ExerciseSession session = new ExerciseSession();
        session.setUuid(UUID.randomUUID());
        session.setUser(new User(userId));
        session.setExerciseCatalog(catalog);
        session.setDurationMinutes(durationMinutes);
        session.setCaloriesBurned(caloriesBurned);
        session.setNotes(notes);
        session.setExerciseDate(LocalDate.now());
        session.setCreatedAt(LocalDateTime.now());

        return exerciseSessionRepository.save(session);
    }

    public List<ExerciseSession> getExerciseHistory(User user, LocalDate startDate, LocalDate endDate) {
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
            user, startDate, endDate);
    }

    public List<ExerciseCatalog> searchExercises(String keyword) {
        return exerciseCatalogRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<ExerciseCatalog> getExercisesByBodyPart(String bodyPart) {
        return exerciseCatalogRepository.findByBodyPart(bodyPart);
    }
} 