package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
public class NoteExerciseService {

    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseCatalogRepository exerciseCatalogRepository;
    private final UserRepository userRepository;

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

    // ✅ 운동 기록 추가
    public void addExercise(ExerciseRecordDTO dto) {
        ExerciseSession session = new ExerciseSession();

        // 🔸 User 객체 설정
        User user = userRepository.findById(dto.getUserId())
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));
        session.setUser(user);

        // 🔸 운동 카탈로그 설정
        ExerciseCatalog catalog = exerciseCatalogRepository.findByName(dto.getExerciseName())
                .orElseGet(() -> {
                    ExerciseCatalog newCatalog = new ExerciseCatalog();
                    newCatalog.setName(dto.getExerciseName());
                    return exerciseCatalogRepository.save(newCatalog);
                });
        session.setExerciseCatalog(catalog);

        // 🔸 기본 필드 설정
        session.setExerciseDate(dto.getExerciseDate());
        session.setSets(dto.getSets());
        session.setReps(dto.getReps());
        session.setWeight(dto.getWeight());

        // 🔸 "20분" → 숫자 파싱
        if (dto.getDurationFormatted() != null && dto.getDurationFormatted().endsWith("분")) {
            try {
                int minutes = Integer.parseInt(dto.getDurationFormatted().replace("분", "").trim());
                session.setDurationMinutes(minutes);
            } catch (NumberFormatException e) {
                session.setDurationMinutes(null);
            }
        }

        exerciseSessionRepository.save(session);
    }
}