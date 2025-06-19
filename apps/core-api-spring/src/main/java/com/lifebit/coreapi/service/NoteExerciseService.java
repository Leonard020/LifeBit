package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.repository.NoteExerciseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NoteExerciseService {

    private final NoteExerciseRepository noteExerciseRepository;

    public List<NoteExerciseDTO> getTodayExerciseRecords(Long userId, LocalDate date) {
        return noteExerciseRepository.findByUser_UserIdAndExerciseDate(userId, date)
                .stream()
                .map(session -> new NoteExerciseDTO(
                    session.getExerciseCatalog().getName(),
                    session.getSets(),
                    session.getReps(),
                    session.getWeight() != null ? session.getWeight().doubleValue() : 0.0,
                    session.getDurationMinutes() + "분"
                ))
                .collect(Collectors.toList());
    }
}