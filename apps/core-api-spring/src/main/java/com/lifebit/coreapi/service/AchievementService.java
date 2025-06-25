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
        
        // 목표 달성 확인
        if (achievement.getTargetDays() != null && progress >= achievement.getTargetDays() && !userAchievement.getIsAchieved()) {
            userAchievement.setIsAchieved(true);
            userAchievement.setAchievedDate(LocalDate.now());
            log.info("Achievement unlocked for user: {}, achievement: {}", userId, achievementTitle);
            notificationService.saveNotification(userId, "ACHIEVEMENT", "업적 달성", String.format("'%s' 업적을 달성했습니다! 🎉", achievement.getTitle()));
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
        
        // 7일 연속 기록 업적
        if (streakDays >= 7) {
            updateUserAchievementProgress(userId, "7일 연속 기록", streakDays);
        }
        
        // 30일 연속 기록 업적
        if (streakDays >= 30) {
            updateUserAchievementProgress(userId, "30일 연속 기록", streakDays);
        }
        
        // 100일 연속 기록 업적
        if (streakDays >= 100) {
            updateUserAchievementProgress(userId, "100일 연속 기록", streakDays);
        }
        
        // 1년 연속 기록 업적
        if (streakDays >= 365) {
            updateUserAchievementProgress(userId, "1년 연속 기록", streakDays);
        }
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