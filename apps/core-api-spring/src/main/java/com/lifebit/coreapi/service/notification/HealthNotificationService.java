package com.lifebit.coreapi.service.notification;

import com.lifebit.coreapi.entity.ranking.RankingNotification;
import com.lifebit.coreapi.repository.ranking.RankingNotificationRepository;
import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.service.MealService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class HealthNotificationService {
    
    private final RankingNotificationRepository rankingNotificationRepository;
    private final ExerciseService exerciseService;
    private final MealService mealService;

    // 상수 정의
    private static final int MAX_WEEKLY_EXERCISE_MINUTES = 300; // 5시간
    private static final int MIN_WEEKLY_EXERCISE_COUNT = 5; // 주 5회
    private static final int MIN_STREAK_DAYS = 7; // 7일 연속
    private static final int MIN_NUTRITION_RATE = 50; // 최소 영양소 달성률
    private static final double HYDRATION_WARNING_PROBABILITY = 0.1; // 10% 확률

    /**
     * 사용자의 건강 상태를 모니터링하고 필요한 알림 생성
     */
    @Transactional
    public Map<String, Object> monitorUserHealth(Long userId) {
        Map<String, Object> result = new HashMap<>();
        int notificationsCreated = 0;

        try {
            // 1. 과도한 운동 체크
            int weeklyExerciseMinutes = exerciseService.getWeeklyExerciseMinutes(userId);
            if (weeklyExerciseMinutes > MAX_WEEKLY_EXERCISE_MINUTES) {
                sendExerciseWarningNotification(userId, 
                    "이번 주 운동량이 5시간을 초과했습니다. 휴식도 중요해요! 💪");
                notificationsCreated++;
            }

            // 2. 주간 운동 목표 달성 체크
            int weeklyExerciseCount = exerciseService.getWeeklyExerciseCount(userId);
            if (weeklyExerciseCount >= MIN_WEEKLY_EXERCISE_COUNT) {
                sendGoalAchievementNotification(userId, "주간 운동", 
                    "이번 주 운동 목표를 달성했습니다! 🎉");
                notificationsCreated++;
            }

            // 3. 연속 운동 일수 체크
            int currentStreak = exerciseService.getCurrentStreak(userId);
            if (currentStreak >= MIN_STREAK_DAYS) {
                sendGoalAchievementNotification(userId, "연속 운동", 
                    "7일 연속 운동을 달성했습니다! 🔥");
                notificationsCreated++;
            }

            // 4. 영양소 불균형 체크
            try {
                int weeklyNutritionRate = mealService.getWeeklyNutritionAchievementRate(userId);
                if (weeklyNutritionRate < MIN_NUTRITION_RATE) {
                    sendNutritionWarningNotification(userId, 
                        "영양소 섭취가 부족합니다. 균형 잡힌 식단을 챙겨주세요! 🥗");
                    notificationsCreated++;
                }
            } catch (Exception e) {
                log.warn("영양소 체크 실패: userId={}, error={}", userId, e.getMessage());
            }

            // 5. 수분 섭취 부족 체크 (예시 - 실제로는 수분 섭취 데이터가 필요)
            if (Math.random() < HYDRATION_WARNING_PROBABILITY) {
                sendHydrationWarningNotification(userId, 
                    "오늘 수분 섭취가 부족합니다. 물을 더 마셔주세요! 💧");
                notificationsCreated++;
            }

            result.put("success", true);
            result.put("notificationsCreated", notificationsCreated);
            result.put("message", notificationsCreated > 0 ? 
                notificationsCreated + "개의 알림이 생성되었습니다." : 
                "건강 상태가 양호합니다.");

        } catch (Exception e) {
            log.error("건강 상태 모니터링 실패: userId={}, error={}", userId, e.getMessage());
            result.put("success", false);
            result.put("error", e.getMessage());
        }

        return result;
    }

    /**
     * 과도한 운동 경고 알림
     */
    @Transactional
    public void sendExerciseWarningNotification(Long userId, String message) {
        try {
            RankingNotification notification = createNotification(userId, "운동 경고", message);
            rankingNotificationRepository.save(notification);
            log.info("운동 경고 알림 생성: userId={}", userId);
        } catch (Exception e) {
            log.error("운동 경고 알림 생성 실패: userId={}, error={}", userId, e.getMessage());
            throw new RuntimeException("운동 경고 알림 생성에 실패했습니다.", e);
        }
    }

    /**
     * 영양소 불균형 알림
     */
    @Transactional
    public void sendNutritionWarningNotification(Long userId, String message) {
        try {
            RankingNotification notification = createNotification(userId, "영양소 경고", message);
            rankingNotificationRepository.save(notification);
            log.info("영양소 경고 알림 생성: userId={}", userId);
        } catch (Exception e) {
            log.error("영양소 경고 알림 생성 실패: userId={}, error={}", userId, e.getMessage());
            throw new RuntimeException("영양소 경고 알림 생성에 실패했습니다.", e);
        }
    }

    /**
     * 수분 섭취 부족 알림
     */
    @Transactional
    public void sendHydrationWarningNotification(Long userId, String message) {
        try {
            RankingNotification notification = createNotification(userId, "수분 섭취 경고", message);
            rankingNotificationRepository.save(notification);
            log.info("수분 섭취 경고 알림 생성: userId={}", userId);
        } catch (Exception e) {
            log.error("수분 섭취 경고 알림 생성 실패: userId={}, error={}", userId, e.getMessage());
            throw new RuntimeException("수분 섭취 경고 알림 생성에 실패했습니다.", e);
        }
    }

    /**
     * 목표 달성 알림
     */
    @Transactional
    public void sendGoalAchievementNotification(Long userId, String goalType, String message) {
        try {
            RankingNotification notification = createNotification(userId, goalType + " 목표 달성", message);
            notification.setType(RankingNotification.NotificationType.ACHIEVEMENT);
            rankingNotificationRepository.save(notification);
            log.info("목표 달성 알림 생성: userId={}, goalType={}", userId, goalType);
        } catch (Exception e) {
            log.error("목표 달성 알림 생성 실패: userId={}, error={}", userId, e.getMessage());
            throw new RuntimeException("목표 달성 알림 생성에 실패했습니다.", e);
        }
    }

    /**
     * 알림 객체 생성 헬퍼 메서드
     */
    private RankingNotification createNotification(Long userId, String title, String message) {
        RankingNotification notification = new RankingNotification();
        notification.setUserId(userId);
        notification.setType(RankingNotification.NotificationType.RANK_CHANGE);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        return notification;
    }
} 