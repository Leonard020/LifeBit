package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NoteExerciseService {

    private final ExerciseSessionRepository exerciseSessionRepository;

    // ✅ 주간 요약 데이터
    public List<NoteExerciseDTO> getWeeklyExerciseSummary(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateBetween(
                userId, weekStart, weekEnd
        );

        Map<LocalDate, NoteExerciseDTO> summaryMap = new TreeMap<>();
        for (ExerciseSession session : sessions) {
            LocalDate date = session.getExerciseDate();
            NoteExerciseDTO dto = summaryMap.getOrDefault(date, new NoteExerciseDTO(date));
            dto.addSession(session);
            summaryMap.put(date, dto);
        }

        return new ArrayList<>(summaryMap.values());
    }

    // ✅ 일일 기록 데이터 (세션 하나하나 반환)
    public List<ExerciseRecordDTO> getTodayExerciseRecords(Long userId, LocalDate date) {
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDate(userId, date);
        return sessions.stream()
                .map(ExerciseRecordDTO::new)
                .toList();
    }
}