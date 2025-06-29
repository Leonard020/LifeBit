package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import com.lifebit.coreapi.entity.enums.AchievementType;

@Service
@RequiredArgsConstructor
public class NoteExerciseService {

    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseCatalogRepository exerciseCatalogRepository;
    private final UserRepository userRepository;
    private final AchievementService achievementService;

    // ✅ 주간 요약 데이터
    public List<NoteExerciseDTO> getWeeklyExerciseSummary(Long userId, LocalDate weekStart) {
        LocalDate weekEnd = weekStart.plusDays(6);
        System.out.println("🟣 getWeeklyExerciseSummary called: userId=" + userId + ", weekStart=" + weekStart + ", weekEnd=" + weekEnd);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateBetweenWithCatalog(
                userId, weekStart, weekEnd);
        System.out.println("🟣 sessions.size()=" + sessions.size());
        for (ExerciseSession s : sessions) {
            System.out.println("  - session: " + s.getExerciseDate() + ", " + s.getExerciseCatalog().getName());
        }

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
    @Transactional
    public List<ExerciseRecordDTO> getTodayExerciseRecords(Long userId, LocalDate date) {
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateWithCatalog(userId, date);
        return sessions.stream()
                .map(ExerciseRecordDTO::new)
                .toList();
    }

    // ✅ 운동 기록 추가 + DTO 리턴
    public ExerciseRecordDTO addExercise(ExerciseRecordDTO dto) {
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
        session.setWeight(dto.getWeight() != null ? BigDecimal.valueOf(dto.getWeight()) : null);
        session.setDurationMinutes(dto.getDurationMinutes());

        // ✅ 저장
        ExerciseSession saved = exerciseSessionRepository.save(session);

        // ✅ 업적 체크 및 업데이트
        try {
            // 사용자 업적 초기화 (없으면 생성)
            achievementService.initializeUserAchievements(dto.getUserId());
            
            // 연속 운동 일수 계산 및 업적 업데이트
            int currentStreak = calculateCurrentStreak(dto.getUserId());
            achievementService.updateStreakAchievements(dto.getUserId(), currentStreak);
            
            // 총 운동 일수 업적 업데이트 (설정 기반)
            int totalWorkoutDays = getTotalWorkoutDays(dto.getUserId());
            achievementService.updateUserAchievementProgress(dto.getUserId(), 
                AchievementType.TOTAL_WORKOUT_DAYS.getTitle(), totalWorkoutDays);
            
            // 주간 운동 횟수 업적 업데이트 (설정 기반)
            int weeklyExerciseCount = getWeeklyExerciseCount(dto.getUserId());
            achievementService.updateUserAchievementProgress(dto.getUserId(), 
                AchievementType.WEEKLY_EXERCISE.getTitle(), weeklyExerciseCount);
            
        } catch (Exception e) {
            // 업적 업데이트 실패 시 로그만 남기고 계속 진행
            System.err.println("Failed to update achievements: " + e.getMessage());
        }

        // ✅ DTO 반환
        return new ExerciseRecordDTO(saved);
    }

    // ✅ 운동 기록 삭제 기능
    public void deleteExercise(Long sessionId, Long userId) {
        ExerciseSession session = exerciseSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("운동 기록을 찾을 수 없습니다."));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("삭제 권한이 없습니다.");
        }

        exerciseSessionRepository.delete(session);
    }

    // ✅ 운동 기록 수정
    public ExerciseRecordDTO updateExercise(Long sessionId, Long userId, ExerciseRecordDTO dto) {
        ExerciseSession session = exerciseSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("운동 기록이 존재하지 않습니다."));

        if (!session.getUser().getUserId().equals(userId)) {
            throw new RuntimeException("수정 권한이 없습니다.");
        }

        // ✏️ 수정 가능한 필드만 갱신
        session.setSets(dto.getSets());
        session.setReps(dto.getReps());
        session.setWeight(dto.getWeight() != null ? BigDecimal.valueOf(dto.getWeight()) : null);
        session.setDurationMinutes(dto.getDurationMinutes());

        // 💾 저장 후 DTO 변환하여 반환
        ExerciseSession saved = exerciseSessionRepository.save(session);
        return new ExerciseRecordDTO(saved);
    }

    // ✅ 연속 운동 일수 계산
    private int calculateCurrentStreak(Long userId) {
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateBetween(
            userId, LocalDate.now().minusDays(365), LocalDate.now());
        
        if (sessions.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate currentDate = LocalDate.now();
        
        // 오늘부터 역순으로 연속 운동 일수 계산
        for (ExerciseSession session : sessions) {
            if (session.getExerciseDate().equals(currentDate)) {
                streak++;
                currentDate = currentDate.minusDays(1);
            } else if (session.getExerciseDate().isBefore(currentDate)) {
                break; // 연속이 끊어짐
            }
        }
        
        return streak;
    }

    // ✅ 총 운동 일수 계산
    private int getTotalWorkoutDays(Long userId) {
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateBetween(
            userId, LocalDate.now().minusDays(365), LocalDate.now());
        
        return (int) sessions.stream()
            .map(ExerciseSession::getExerciseDate)
            .distinct()
            .count();
    }

    // ✅ 주간 운동 횟수 계산
    private int getWeeklyExerciseCount(Long userId) {
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUser_UserIdAndExerciseDateBetween(
            userId, LocalDate.now().minusDays(7), LocalDate.now());
        
        return sessions.size();
    }
}