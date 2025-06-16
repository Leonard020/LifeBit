package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
public class ExerciseServiceTest {

    @Mock
    private ExerciseSessionRepository exerciseSessionRepository;

    @Mock
    private ExerciseCatalogRepository exerciseCatalogRepository;

    @InjectMocks
    private ExerciseService exerciseService;

    @Test
    void recordExercise_ValidInput_ReturnsExerciseSession() {
        // Given
        Long userId = 1L;
        Long catalogId = 1L;
        Integer durationMinutes = 30;
        Integer caloriesBurned = 300;
        String notes = "Test exercise";

        ExerciseCatalog catalog = new ExerciseCatalog();
        catalog.setExerciseCatalogId(catalogId);
        catalog.setName("Push-up");

        ExerciseSession session = new ExerciseSession();
        session.setExerciseSessionId(1L);
        session.setExerciseCatalog(catalog);
        session.setDurationMinutes(durationMinutes);
        session.setCaloriesBurned(caloriesBurned);
        session.setNotes(notes);

        when(exerciseCatalogRepository.findById(catalogId)).thenReturn(Optional.of(catalog));
        when(exerciseSessionRepository.save(any(ExerciseSession.class))).thenReturn(session);

        // When
        ExerciseSession result = exerciseService.recordExercise(userId, catalogId, durationMinutes, caloriesBurned, notes);

        // Then
        assertNotNull(result);
        assertEquals(durationMinutes, result.getDurationMinutes());
        assertEquals(caloriesBurned, result.getCaloriesBurned());
        assertEquals(notes, result.getNotes());
        assertEquals(catalog, result.getExerciseCatalog());
    }
} 