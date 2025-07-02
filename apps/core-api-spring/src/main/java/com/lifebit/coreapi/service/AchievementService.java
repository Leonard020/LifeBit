package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.Achievement;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.UserAchievement;
import com.lifebit.coreapi.repository.AchievementRepository;
import com.lifebit.coreapi.repository.UserAchievementRepository;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.lifebit.coreapi.entity.enums.AchievementType;
import com.lifebit.coreapi.event.AchievementCompletedEvent;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import com.lifebit.coreapi.repository.HealthRecordRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {
    
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ApplicationEventPublisher eventPublisher;
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final MealLogRepository mealLogRepository;
    private final HealthRecordRepository healthRecordRepository;
    
    /**
     * 특정 사용자의 업적 정보를 조회합니다.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getUserAchievements(Long userId) {
        log.debug("Getting achievements for user: {}", userId);
        
        List<UserAchievement> userAchievements = userAchievementRepository.findByUserIdWithAchievements(userId);
        
        // 정렬: 달성된 업적(최신순) → 미달성(진행도 높은 순)
        userAchievements.sort((a, b) -> {
            boolean aAchieved = Boolean.TRUE.equals(a.getIsAchieved());
            boolean bAchieved = Boolean.TRUE.equals(b.getIsAchieved());
            if (aAchieved && !bAchieved) return -1;
            if (!aAchieved && bAchieved) return 1;
            if (aAchieved && bAchieved) {
                if (a.getAchievedDate() != null && b.getAchievedDate() != null)
                    return b.getAchievedDate().compareTo(a.getAchievedDate());
                if (a.getAchievedDate() != null) return -1;
                if (b.getAchievedDate() != null) return 1;
                return 0;
            }
            // 미달성: 진행도 높은 순
            double aProgress = a.getProgress() / (a.getAchievement().getTargetDays() == null ? 100.0 : a.getAchievement().getTargetDays());
            double bProgress = b.getProgress() / (b.getAchievement().getTargetDays() == null ? 100.0 : b.getAchievement().getTargetDays());
            return Double.compare(bProgress, aProgress);
        });
        
        return userAchievements.stream()
            .map(this::convertToAchievementMap)
            .collect(Collectors.toList());
    }
    
    /**
     * 사용자가 없는 업적이 있다면 초기화합니다.
     */
    @Transactional
    public void initializeUserAchievements(Long userId) {
        log.debug("Initializing achievements for user: {}", userId);
        
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        List<Achievement> allAchievements = achievementRepository.findByIsActiveTrue();
        
        for (Achievement achievement : allAchievements) {
            boolean exists = userAchievementRepository.findByUserIdAndAchievementId(userId, achievement.getAchievementId())
                .isPresent();
            
            if (!exists) {
                UserAchievement userAchievement = new UserAchievement();
                userAchievement.setUser(user);
                userAchievement.setAchievement(achievement);
                userAchievement.setIsAchieved(false);
                userAchievement.setProgress(0);
                
                userAchievementRepository.save(userAchievement);
                log.debug("Created new user achievement: {} for user: {}", achievement.getTitle(), userId);
            }
        }
    }
    
    /**
     * 사용자의 업적 진행도를 업데이트합니다.
     */
    @Transactional
    public void updateUserAchievementProgress(Long userId, String achievementTitle, int progress) {
        log.info("🟣 [AchievementService] 업적 진행도 업데이트 시작 - 사용자: {}, 업적: {}, 진행도: {}", 
                  userId, achievementTitle, progress);
        
        Achievement achievement = achievementRepository.findByTitle(achievementTitle);
        if (achievement == null) {
            log.error("❌ [AchievementService] 업적을 찾을 수 없음: {}", achievementTitle);
            // DB에 있는 모든 업적 제목을 로그로 출력
            List<Achievement> allAchievements = achievementRepository.findByIsActiveTrue();
            log.info("🟣 [AchievementService] DB에 있는 모든 업적 제목:");
            for (Achievement a : allAchievements) {
                log.info("  - {}", a.getTitle());
            }
            return;
        }
        
        log.info("✅ [AchievementService] 업적 찾음 - ID: {}, 제목: {}, 목표: {}", 
                achievement.getAchievementId(), achievement.getTitle(), achievement.getTargetDays());
        
        UserAchievement userAchievement = userAchievementRepository
            .findByUserIdAndAchievementId(userId, achievement.getAchievementId())
            .orElse(null);
        
        if (userAchievement == null) {
            log.error("❌ [AchievementService] 사용자 업적을 찾을 수 없음 - 사용자: {}, 업적: {}", userId, achievementTitle);
            return;
        }
        
        log.info("🟣 [AchievementService] 현재 진행도: {} → 새 진행도: {}", userAchievement.getProgress(), progress);
        
        userAchievement.setProgress(progress);
        
        // 목표 달성 확인 (진행도가 목표 이상이고 아직 달성되지 않은 경우)
        if (achievement.getTargetDays() != null && progress >= achievement.getTargetDays() && !userAchievement.getIsAchieved()) {
            userAchievement.setIsAchieved(true);
            userAchievement.setAchievedDate(LocalDate.now());
            log.info("🎉 [AchievementService] 업적 달성! - 사용자: {}, 업적: {}", userId, achievementTitle);
            notificationService.saveNotification(userId, "ACHIEVEMENT", "업적 달성", String.format("'%s' 업적을 달성했습니다! 🎉", achievement.getTitle()), userAchievement.getUserAchievementId());
            
            // 랭킹 점수 업데이트 이벤트 발행
            eventPublisher.publishEvent(new AchievementCompletedEvent(userId));
            log.info("📢 [AchievementService] 업적 달성 이벤트 발행 - 사용자: {}", userId);
        }
        
        userAchievementRepository.save(userAchievement);
        log.info("✅ [AchievementService] 업적 진행도 업데이트 완료 - 사용자: {}, 업적: {}, 진행도: {}", 
                userId, achievementTitle, progress);
    }
    
    /**
     * UserAchievement를 Map으로 변환합니다.
     */
    private Map<String, Object> convertToAchievementMap(UserAchievement userAchievement) {
        Achievement achievement = userAchievement.getAchievement();
        
        Map<String, Object> map = new HashMap<>();
        map.put("title", achievement.getTitle());
        map.put("description", achievement.getDescription());
        map.put("badge", achievement.getBadgeType().name());
        map.put("achieved", userAchievement.getIsAchieved());
        map.put("progress", userAchievement.getProgress());
        
        if (achievement.getTargetDays() != null) {
            map.put("target", achievement.getTargetDays());
        }
        
        if (userAchievement.getAchievedDate() != null) {
            map.put("date", userAchievement.getAchievedDate().toString());
        }
        
        return map;
    }
    
    /**
     * 사용자의 연속 운동 일수를 계산하여 관련 업적을 업데이트합니다.
     */
    @Transactional
    public void updateStreakAchievements(Long userId, int streakDays) {
        log.debug("Updating streak achievements for user: {}, streak: {}", userId, streakDays);
        
        // 사용자 업적이 없으면 초기화
        initializeUserAchievements(userId);
        
        // 연속 운동 업적 업데이트 (모든 업적을 항상 업데이트)
        updateUserAchievementProgress(userId, AchievementType.STREAK_7.getTitle(), streakDays);
        updateUserAchievementProgress(userId, AchievementType.STREAK_30.getTitle(), streakDays);
        updateUserAchievementProgress(userId, AchievementType.STREAK_90.getTitle(), streakDays);
        updateUserAchievementProgress(userId, AchievementType.STREAK_180.getTitle(), streakDays);
    }
    
    /**
     * 사용자가 수동으로 업적을 달성 처리합니다.
     */
    @Transactional
    public void completeAchievement(Long userId, String achievementTitle) {
        log.debug("Completing achievement for user: {}, achievement: {}", userId, achievementTitle);
        
        Achievement achievement = achievementRepository.findByTitle(achievementTitle);
        if (achievement == null) {
            log.warn("Achievement not found: {}", achievementTitle);
            throw new RuntimeException("업적을 찾을 수 없습니다: " + achievementTitle);
        }
        
        UserAchievement userAchievement = userAchievementRepository
            .findByUserIdAndAchievementId(userId, achievement.getAchievementId())
            .orElse(null);
        
        if (userAchievement == null) {
            log.warn("User achievement not found for user: {}, achievement: {}", userId, achievementTitle);
            throw new RuntimeException("사용자 업적을 찾을 수 없습니다.");
        }
        
        // 이미 달성된 경우
        if (userAchievement.getIsAchieved()) {
            log.info("Achievement already completed for user: {}, achievement: {}", userId, achievementTitle);
            return;
        }
        
        // 진행도가 목표에 도달하지 않은 경우
        if (achievement.getTargetDays() != null && userAchievement.getProgress() < achievement.getTargetDays()) {
            log.warn("Progress not enough for achievement completion. Progress: {}, Target: {}", 
                    userAchievement.getProgress(), achievement.getTargetDays());
            throw new RuntimeException("업적 달성을 위한 진행도가 부족합니다.");
        }
        
        // 업적 달성 처리
        userAchievement.setIsAchieved(true);
        userAchievement.setAchievedDate(LocalDate.now());
        
        userAchievementRepository.save(userAchievement);
        
        log.info("Achievement manually completed for user: {}, achievement: {}", userId, achievementTitle);
        notificationService.saveNotification(userId, "ACHIEVEMENT", "업적 달성", String.format("'%s' 업적을 달성했습니다! 🎉", achievement.getTitle()), userAchievement.getUserAchievementId());
        
        // 랭킹 점수 업데이트 이벤트 발행
        eventPublisher.publishEvent(new AchievementCompletedEvent(userId));
        log.info("Achievement completion event published for user: {}", userId);
    }
    
    /**
     * 유저별 달성 업적 개수 반환
     */
    @Transactional(readOnly = true)
    public int getUserAchievementCount(Long userId) {
        return (int) userAchievementRepository.findByUserIdWithAchievements(userId)
            .stream().filter(ua -> Boolean.TRUE.equals(ua.getIsAchieved())).count();
    }
    
    /**
     * 연속형 업적(연속 운동/식단 기록) 자동 체크 및 달성 처리
     */
    @Transactional
    public void checkAndUpdateStreakAchievements(Long userId) {
        // 1. 운동 연속 기록
        List<LocalDate> exerciseDates = exerciseSessionRepository.findValidatedExerciseDatesByUserId(userId);
        int maxExerciseStreak = calculateMaxStreak(exerciseDates);
        updateUserAchievementProgress(userId, "7일 연속 운동", maxExerciseStreak);
        updateUserAchievementProgress(userId, "30일 연속 운동", maxExerciseStreak);

        // 2. 식단 연속 기록
        List<LocalDate> mealDates = mealLogRepository.findValidatedMealDatesByUserId(userId);
        int maxMealStreak = calculateMaxStreak(mealDates);
        updateUserAchievementProgress(userId, "7일 연속 식단", maxMealStreak);
        updateUserAchievementProgress(userId, "30일 연속 식단", maxMealStreak);
    }

    /** 날짜 리스트에서 최대 연속 기록 일수 계산 */
    private int calculateMaxStreak(List<LocalDate> dates) {
        if (dates == null || dates.isEmpty()) return 0;
        int maxStreak = 1, curStreak = 1;
        for (int i = 1; i < dates.size(); i++) {
            if (dates.get(i).equals(dates.get(i - 1).plusDays(1))) {
                curStreak++;
                maxStreak = Math.max(maxStreak, curStreak);
            } else {
                curStreak = 1;
            }
        }
        return maxStreak;
    }

    /**
     * 특정 요일/시간대 업적(아침 운동, 저녁 운동, 주말 운동) 자동 체크 및 달성 처리
     */
    @Transactional
    public void checkAndUpdateTimePeriodAchievements(Long userId) {
        // 아침 운동 업적
        long morningCount = exerciseSessionRepository.countMorningWorkoutsByUserId(userId);
        updateUserAchievementProgress(userId, "아침 운동 10회 달성", (int)morningCount);

        // 저녁 운동 업적
        long nightCount = exerciseSessionRepository.countNightWorkoutsByUserId(userId);
        updateUserAchievementProgress(userId, "저녁 운동 10회 달성", (int)nightCount);

        // 주말 운동 업적
        long weekendCount = exerciseSessionRepository.countWeekendWorkoutsByUserId(userId);
        updateUserAchievementProgress(userId, "주말 운동 5회 달성", (int)weekendCount);
    }

    /**
     * 특정 값 도달 업적(체중 목표, 누적 칼로리, 총 운동 시간) 자동 체크 및 달성 처리
     */
    @Transactional
    public void checkAndUpdateValueAchievements(Long userId) {
        // 1. 체중 목표 달성 (예: 60kg 이하)
        boolean weightGoal = healthRecordRepository.existsWeightGoalAchieved(userId, 60.0);
        updateUserAchievementProgress(userId, "체중 60kg 달성", weightGoal ? 1 : 0);

        // 2. 누적 칼로리 소모
        int totalCalories = exerciseSessionRepository.sumTotalCaloriesBurnedByUserId(userId);
        updateUserAchievementProgress(userId, "누적 칼로리 10000kcal 달성", totalCalories);

        // 3. 총 운동 시간
        int totalMinutes = exerciseSessionRepository.sumTotalWorkoutMinutesByUserId(userId);
        updateUserAchievementProgress(userId, "총 운동 1000분 달성", totalMinutes);
    }
} 