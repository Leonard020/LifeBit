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
        // String을 BodyPartType으로 변환
        try {
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = 
                com.lifebit.coreapi.entity.BodyPartType.valueOf(bodyPart.toUpperCase());
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
        
        User user = new User(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
            user, startDate, endDate);
    }

    /**
     * 사용자의 최근 N일간 운동 세션 조회
     */
    public List<ExerciseSession> getRecentExerciseSessions(Long userId, int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        LocalDate endDate = LocalDate.now();
        User user = new User(userId);
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
        User user = new User(userId);
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
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = 
                com.lifebit.coreapi.entity.BodyPartType.valueOf(bodyPart.toUpperCase());
            newExercise.setBodyPart(bodyPartType);
        } catch (IllegalArgumentException e) {
            // 기본값 설정
            newExercise.setBodyPart(com.lifebit.coreapi.entity.BodyPartType.cardio);
        }
        
        newExercise.setDescription(description);
        newExercise.setCreatedAt(LocalDateTime.now());
        
        return exerciseCatalogRepository.save(newExercise);
    }
} 