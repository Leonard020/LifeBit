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

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import com.lifebit.coreapi.entity.enums.AchievementType;

@Service
@RequiredArgsConstructor
@Slf4j
public class AchievementService {
    
    private final AchievementRepository achievementRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
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
        log.debug("Updating achievement progress for user: {}, achievement: {}, progress: {}", 
                  userId, achievementTitle, progress);
        
        Achievement achievement = achievementRepository.findByTitle(achievementTitle);
        if (achievement == null) {
            log.warn("Achievement not found: {}", achievementTitle);
            return;
        }
        
        UserAchievement userAchievement = userAchievementRepository
            .findByUserIdAndAchievementId(userId, achievement.getAchievementId())
            .orElse(null);
        
        if (userAchievement == null) {
            log.warn("User achievement not found for user: {}, achievement: {}", userId, achievementTitle);
            return;
        }
        
        userAchievement.setProgress(progress);
        
        // 목표 달성 확인 (진행도가 목표 이상이고 아직 달성되지 않은 경우)
        if (achievement.getTargetDays() != null && progress >= achievement.getTargetDays() && !userAchievement.getIsAchieved()) {
            userAchievement.setIsAchieved(true);
            userAchievement.setAchievedDate(LocalDate.now());
            log.info("Achievement unlocked for user: {}, achievement: {}", userId, achievementTitle);
            notificationService.saveNotification(userId, "ACHIEVEMENT", "업적 달성", String.format("'%s' 업적을 달성했습니다! 🎉", achievement.getTitle()), userAchievement.getUserAchievementId());
        }
        
        userAchievementRepository.save(userAchievement);
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
        
        // 연속 운동 업적 업데이트 (설정 기반)
        if (streakDays >= 7) {
            updateUserAchievementProgress(userId, AchievementType.STREAK_7.getTitle(), streakDays);
        }
        
        if (streakDays >= 30) {
            updateUserAchievementProgress(userId, AchievementType.STREAK_30.getTitle(), streakDays);
        }
        
        if (streakDays >= 90) {
            updateUserAchievementProgress(userId, AchievementType.STREAK_90.getTitle(), streakDays);
        }
        
        if (streakDays >= 180) {
            updateUserAchievementProgress(userId, AchievementType.STREAK_180.getTitle(), streakDays);
        }
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
    }
    
    /**
     * 유저별 달성 업적 개수 반환
     */
    @Transactional(readOnly = true)
    public int getUserAchievementCount(Long userId) {
        return (int) userAchievementRepository.findByUserIdWithAchievements(userId)
            .stream().filter(ua -> Boolean.TRUE.equals(ua.getIsAchieved())).count();
    }
} 