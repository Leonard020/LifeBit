package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.Achievement;
import com.lifebit.coreapi.entity.BadgeType;
import com.lifebit.coreapi.entity.UserRanking;
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
            createAchievement("첫 운동 시작", "첫 운동을 기록해보세요", BadgeType.FIRST_LOGIN, 1),
            createAchievement("운동 3일 연속", "3일 연속으로 운동해보세요", BadgeType.STREAK_7, 3),
            createAchievement("운동 7일 연속", "일주일 연속 운동의 달인!", BadgeType.STREAK_7, 7),
            createAchievement("운동 30일 연속", "한 달 연속 운동 챌린지!", BadgeType.STREAK_30, 30),
            createAchievement("첫 식단 기록", "첫 식단을 기록해보세요", BadgeType.FIRST_LOGIN, 1),
            createAchievement("건강한 한 주", "일주일 동안 꾸준히 기록하기", BadgeType.STREAK_7, 7),
            createAchievement("목표 달성", "설정한 목표를 달성해보세요", BadgeType.WORKOUT_GOAL, 1),
            createAchievement("완벽한 한 주", "일주일 동안 모든 목표를 달성하세요", BadgeType.PERFECT_WEEK, 7),
            createAchievement("영양 균형", "영양 목표를 달성해보세요", BadgeType.NUTRITION_GOAL, 1),
            createAchievement("체중 관리", "체중 목표를 달성해보세요", BadgeType.WEIGHT_GOAL, 1)
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