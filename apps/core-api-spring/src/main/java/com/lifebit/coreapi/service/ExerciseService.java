package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import com.lifebit.coreapi.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.lifebit.coreapi.entity.TimePeriodType;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ExerciseService {
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseCatalogRepository exerciseCatalogRepository;
    private final UserRepository userRepository;

    @Transactional
    public ExerciseSession recordExercise(
            Long userId, Long catalogId, Integer duration_minutes, Integer caloriesBurned, String notes,
            Integer sets, Integer reps, Double weight, LocalDate exerciseDate, TimePeriodType timePeriod) {
        ExerciseCatalog catalog = exerciseCatalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Exercise catalog not found"));

        ExerciseSession session = new ExerciseSession();
        session.setUuid(UUID.randomUUID());
        session.setUser(userRepository.getReferenceById(userId));
        session.setExerciseCatalog(catalog);
        session.setDurationMinutes(duration_minutes);
        session.setCaloriesBurned(caloriesBurned);
        session.setNotes(notes);
        session.setExerciseDate(exerciseDate != null ? exerciseDate : LocalDate.now());
        session.setCreatedAt(LocalDateTime.now());

        session.setSets(sets != null ? sets : 0);
        session.setReps(reps != null ? reps : 0);
        session.setWeight(weight != null ? BigDecimal.valueOf(weight) : BigDecimal.ZERO);
        session.setTimePeriod(timePeriod);

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
        // String을 BodyPartType으로 변환
        try {
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = com.lifebit.coreapi.entity.BodyPartType
                    .valueOf(bodyPart.toUpperCase());
            return exerciseCatalogRepository.findByBodyPart(bodyPartType);
        } catch (IllegalArgumentException e) {
            // 잘못된 bodyPart 값인 경우 빈 리스트 반환
            return List.of();
        }
    }

    /**
     * 사용자의 최근 운동 세션 조회 (기간별)
     */
    public List<ExerciseSession> getRecentExerciseSessions(Long userId, String period) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate;

        // 기간에 따른 시작 날짜 계산
        switch (period.toLowerCase()) {
            case "day":
                startDate = endDate.minusDays(1);
                break;
            case "week":
                startDate = endDate.minusDays(7);
                break;
            case "month":
                startDate = endDate.minusMonths(1);
                break;
            case "year":
                startDate = endDate.minusYears(1);
                break;
            default:
                startDate = endDate.minusMonths(1); // 기본값: 1개월
        }

        User user = userRepository.getReferenceById(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }

    /**
     * 사용자의 최근 N일간 운동 세션 조회
     */
    public List<ExerciseSession> getRecentExerciseSessions(Long userId, int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        LocalDate endDate = LocalDate.now();
        User user = userRepository.getReferenceById(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }

    /**
     * 최근 7일간 운동 횟수 조회
     */
    public int getWeeklyExerciseCount(Long userId) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, 7);
        return sessions.size();
    }

    /**
     * 최근 7일간 총 칼로리 소모량 조회
     */
    public int getWeeklyCaloriesBurned(Long userId) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, 7);
        return sessions.stream()
                .mapToInt(session -> session.getCaloriesBurned() != null ? session.getCaloriesBurned() : 0)
                .sum();
    }

    /**
     * 최근 7일간 총 운동 시간(분) 조회
     */
    public int getWeeklyExerciseMinutes(Long userId) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, 7);
        return sessions.stream()
                .mapToInt(session -> session.getDurationMinutes() != null ? session.getDurationMinutes() : 0)
                .sum();
    }

    /**
     * 현재 연속 운동 일수 계산
     */
    public int getCurrentStreak(Long userId) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, 365); // 최근 1년
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

    /**
     * 총 운동 일수 조회
     */
    public int getTotalWorkoutDays(Long userId) {
        User user = userRepository.getReferenceById(userId);
        return (int) exerciseSessionRepository.countDistinctExerciseDateByUser(user);
    }

    /**
     * 운동 카탈로그 찾기 또는 생성 메서드 추가
     */
    @Transactional
    public ExerciseCatalog findOrCreateExercise(String name, String bodyPart, String description) {
        // 먼저 기존 운동 검색
        List<ExerciseCatalog> existingExercises = exerciseCatalogRepository.findByNameContainingIgnoreCase(name);

        if (!existingExercises.isEmpty()) {
            // 정확히 일치하는 이름이 있는지 확인
            for (ExerciseCatalog exercise : existingExercises) {
                if (exercise.getName().equalsIgnoreCase(name)) {
                    return exercise;
                }
            }
        }

        // 새로운 운동 카탈로그 생성
        ExerciseCatalog newExercise = new ExerciseCatalog();
        newExercise.setUuid(java.util.UUID.randomUUID());
        newExercise.setName(name);

        // bodyPart를 BodyPartType으로 변환
        try {
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = com.lifebit.coreapi.entity.BodyPartType
                    .valueOf(bodyPart.toUpperCase());
            newExercise.setBodyPart(bodyPartType);
        } catch (IllegalArgumentException e) {
            // 기본값 설정
            newExercise.setBodyPart(com.lifebit.coreapi.entity.BodyPartType.cardio);
        }

        newExercise.setDescription(description);
        newExercise.setCreatedAt(LocalDateTime.now());

        return exerciseCatalogRepository.save(newExercise);
    }

    /**
     * ID로 운동 세션 조회
     */
    public ExerciseSession getExerciseSessionById(Long sessionId) {
        return exerciseSessionRepository.findById(sessionId).orElse(null);
    }

    /**
     * ID로 운동 카탈로그 조회
     */
    @Transactional
    public ExerciseSession setExerciseCatalog(ExerciseSession session, Long catalogId) {
        ExerciseCatalog catalog = exerciseCatalogRepository.findById(catalogId)
                .orElseThrow(() -> new RuntimeException("운동 종류를 찾을 수 없습니다."));
        session.setExerciseCatalog(catalog);
        return session;
    }

    /**
     * 운동 세션 업데이트
     */
    @Transactional
    public ExerciseSession updateExerciseSession(ExerciseSession exerciseSession) {
        // 💥 기존 세션은 detached 상태일 수 있으므로, merge 전에 다시 참조 획득
        ExerciseSession managedSession = exerciseSessionRepository.findById(exerciseSession.getExerciseSessionId())
                .orElseThrow(() -> new RuntimeException("운동 세션을 찾을 수 없습니다."));

        // 필드 복사
        managedSession.setDurationMinutes(exerciseSession.getDurationMinutes());
        managedSession.setCaloriesBurned(exerciseSession.getCaloriesBurned());
        managedSession.setNotes(exerciseSession.getNotes());
        managedSession.setExerciseDate(exerciseSession.getExerciseDate());
        managedSession.setSets(exerciseSession.getSets());
        managedSession.setReps(exerciseSession.getReps());
        managedSession.setWeight(exerciseSession.getWeight());
        managedSession.setTimePeriod(exerciseSession.getTimePeriod());

        // ✅ 연관관계도 확인
        if (exerciseSession.getExerciseCatalog() != null) {
            ExerciseCatalog catalog = exerciseCatalogRepository.findById(
                    exerciseSession.getExerciseCatalog().getExerciseCatalogId())
                    .orElseThrow(() -> new RuntimeException("운동 카탈로그를 찾을 수 없습니다."));
            managedSession.setExerciseCatalog(catalog);
        }

        // 이 시점에서는 Lazy 로딩 OK
        managedSession.getExerciseCatalog().getName();
        managedSession.getUser().getUserId();

        return managedSession;
    }

    /**
     * 운동 세션 삭제
     */
    @Transactional
    public void deleteExerciseSession(Long sessionId) {
        if (!exerciseSessionRepository.existsById(sessionId)) {
            throw new RuntimeException("운동 세션을 찾을 수 없습니다: " + sessionId);
        }
        exerciseSessionRepository.deleteById(sessionId);
    }

    /**
     * 모든 운동 카탈로그 조회
     */
    public List<ExerciseCatalog> getAllExerciseCatalog() {
        return exerciseCatalogRepository.findAll();
    }

    /**
     * 지정된 기간 동안의 운동 횟수 조회
     */
    public int getExerciseCountByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.size();
    }

    /**
     * 지정된 기간 동안의 총 운동 시간(분) 조회
     */
    public int getExerciseMinutesByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.stream()
                .mapToInt(session -> session.getDurationMinutes() != null ? session.getDurationMinutes() : 0)
                .sum();
    }

    /**
     * 지정된 기간 동안의 총 칼로리 소모량 조회
     */
    public int getCaloriesBurnedByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.stream()
                .mapToInt(session -> session.getCaloriesBurned() != null ? session.getCaloriesBurned() : 0)
                .sum();
    }

    public List<ExerciseSession> getExerciseSessions(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.getReferenceById(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }
}