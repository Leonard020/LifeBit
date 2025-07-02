package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.Achievement;
import com.lifebit.coreapi.entity.BadgeType;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.AchievementType;
import com.lifebit.coreapi.entity.enums.RankingTier;
import com.lifebit.coreapi.repository.AchievementRepository;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataInitializerService {
    
    private final AchievementRepository achievementRepository;
    private final UserRepository userRepository;
    private final UserRankingRepository userRankingRepository;

    @Bean
    public ApplicationRunner initializeData() {
        return args -> {
            log.info("🚀 데이터 초기화 서비스 시작");
            initializeAchievements();
            initializeUserRankings();
            log.info("✅ 데이터 초기화 완료");
        };
    }

    @Transactional
    public void initializeAchievements() {
        // 이미 업적이 있으면 초기화하지 않음
        if (achievementRepository.count() > 0) {
            log.info("📊 업적 데이터가 이미 존재함 (개수: {})", achievementRepository.count());
            return;
        }

        log.info("🏆 기본 업적 데이터 초기화 중...");
        
        List<Achievement> achievements = List.of(
            // AchievementType enum을 사용하여 일관성 보장
            createAchievement(AchievementType.FIRST_EXERCISE.getTitle(), "첫 운동을 기록해보세요", BadgeType.FIRST_LOGIN, AchievementType.FIRST_EXERCISE.getTargetValue()),
            createAchievement(AchievementType.STREAK_7.getTitle(), "일주일 연속 운동의 달인!", BadgeType.STREAK_7, AchievementType.STREAK_7.getTargetValue()),
            createAchievement(AchievementType.STREAK_30.getTitle(), "한 달 연속 운동 챌린지!", BadgeType.STREAK_30, AchievementType.STREAK_30.getTargetValue()),
            createAchievement(AchievementType.STREAK_90.getTitle(), "3개월 연속 운동 챌린지!", BadgeType.STREAK_100, AchievementType.STREAK_90.getTargetValue()),
            createAchievement(AchievementType.STREAK_180.getTitle(), "6개월 연속 운동 레전드!", BadgeType.STREAK_100, AchievementType.STREAK_180.getTargetValue()),
            createAchievement(AchievementType.FIRST_MEAL.getTitle(), "첫 식단을 기록해보세요", BadgeType.FIRST_LOGIN, AchievementType.FIRST_MEAL.getTargetValue()),
            createAchievement(AchievementType.CONSECUTIVE_MEAL_7.getTitle(), "일주일 동안 꾸준히 식단 기록하기", BadgeType.STREAK_7, AchievementType.CONSECUTIVE_MEAL_7.getTargetValue()),
            createAchievement(AchievementType.CONSECUTIVE_MEAL_14.getTitle(), "2주 연속 식단 기록!", BadgeType.NUTRITION_GOAL, AchievementType.CONSECUTIVE_MEAL_14.getTargetValue()),
            createAchievement(AchievementType.CONSECUTIVE_MEAL_30.getTitle(), "한 달 연속 식단 기록!", BadgeType.NUTRITION_GOAL, AchievementType.CONSECUTIVE_MEAL_30.getTargetValue()),
            createAchievement(AchievementType.CONSECUTIVE_MEAL_60.getTitle(), "2개월 연속 식단 기록!", BadgeType.NUTRITION_GOAL, AchievementType.CONSECUTIVE_MEAL_60.getTargetValue()),
            createAchievement(AchievementType.TOTAL_WORKOUT_DAYS.getTitle(), "총 50회 운동 완료!", BadgeType.WORKOUT_GOAL, AchievementType.TOTAL_WORKOUT_DAYS.getTargetValue()),
            createAchievement(AchievementType.WEEKLY_EXERCISE.getTitle(), "주간 7회 운동 완료!", BadgeType.WORKOUT_GOAL, AchievementType.WEEKLY_EXERCISE.getTargetValue()),
            createAchievement(AchievementType.MONTHLY_EXERCISE.getTitle(), "월간 30회 운동 완료!", BadgeType.WORKOUT_GOAL, AchievementType.MONTHLY_EXERCISE.getTargetValue())
        );

        achievementRepository.saveAll(achievements);
        log.info("✅ 기본 업적 {} 개 생성 완료", achievements.size());
    }

    @Transactional
    public void initializeUserRankings() {
        // 모든 사용자에 대해 랭킹 데이터가 없으면 생성
        List<Long> userIds = userRepository.findAll().stream()
            .map(user -> user.getUserId())
            .filter(userId -> userRankingRepository.findByUserId(userId).isEmpty())
            .toList();

        if (userIds.isEmpty()) {
            log.info("📊 사용자 랭킹 데이터가 모두 존재함");
            return;
        }

        log.info("🏅 사용자 랭킹 데이터 초기화 중... (대상 사용자: {}명)", userIds.size());

        for (Long userId : userIds) {
            UserRanking ranking = createDefaultUserRanking(userId);
            userRankingRepository.save(ranking);
            log.debug("✅ 사용자 {} 랭킹 데이터 생성 완료", userId);
        }

        log.info("✅ 사용자 랭킹 {} 개 생성 완료", userIds.size());
    }

    private Achievement createAchievement(String title, String description, BadgeType badgeType, int targetDays) {
        Achievement achievement = new Achievement();
        achievement.setTitle(title);
        achievement.setDescription(description);
        achievement.setBadgeType(badgeType);
        achievement.setTargetDays(targetDays);
        achievement.setIsActive(true);
        achievement.setUuid(UUID.randomUUID());
        achievement.setCreatedAt(LocalDateTime.now());
        return achievement;
    }

    private UserRanking createDefaultUserRanking(Long userId) {
        UserRanking ranking = new UserRanking();
        ranking.setUserId(userId);
        ranking.setTotalScore(0);
        ranking.setStreakDays(0);
        ranking.setRankPosition(0);
        ranking.setSeason(getCurrentSeason());
        ranking.setActive(true);
        ranking.setTier(RankingTier.UNRANK);
        ranking.setCreatedAt(LocalDateTime.now());
        ranking.setLastUpdatedAt(LocalDateTime.now());
        return ranking;
    }

    private int getCurrentSeason() {
        return LocalDateTime.now().getYear();
    }
} 