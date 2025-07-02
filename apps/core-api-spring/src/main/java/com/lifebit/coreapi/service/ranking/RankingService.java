package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.dto.ranking.MyRankingDto;
import com.lifebit.coreapi.dto.ranking.RankingResponseDto;
import com.lifebit.coreapi.dto.ranking.RankingUserDto;
import com.lifebit.coreapi.dto.ranking.MyRankingResponseDto;
import com.lifebit.coreapi.dto.ranking.RankingHistoryDto;
import com.lifebit.coreapi.dto.ranking.RankingStatsDto;
import com.lifebit.coreapi.dto.ranking.RankingRewardDto;
import com.lifebit.coreapi.dto.ranking.RankingNotificationDto;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.RankingHistory;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingHistoryRepository;
import com.lifebit.coreapi.repository.ranking.RankingNotificationRepository;
import com.lifebit.coreapi.repository.UserAchievementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;
import com.lifebit.coreapi.event.AchievementCompletedEvent;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

import com.lifebit.coreapi.entity.enums.RankingTier;
import com.lifebit.coreapi.service.HealthStatisticsService;
import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.service.MealService;
import com.lifebit.coreapi.service.NotificationService;
import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.service.UserGoalService;
import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.FoodItem;
import com.lifebit.coreapi.repository.MealLogRepository;

import java.time.LocalDate;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RankingService {

    private final UserRankingRepository userRankingRepository;
    private final UserRepository userRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final RankingNotificationRepository rankingNotificationRepository;
    private final UserAchievementRepository userAchievementRepository;
    private final HealthStatisticsService healthStatisticsService;
    private final ExerciseService exerciseService;
    private final MealService mealService;
    private final NotificationService notificationService;
    private final UserGoalService userGoalService;
    private final MealLogRepository mealLogRepository;

    @Transactional(readOnly = true)
    public RankingResponseDto getRankingData() {
        User currentUser = getCurrentUser();
        Long currentUserId = currentUser.getUserId();

        // 1. 상위 10명 랭커 조회
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsByStreakDays(PageRequest.of(0, 10));
        List<RankingUserDto> topRankers = new java.util.ArrayList<>();
        int rank = 1;
        for (UserRanking ranking : topRankings) {
            User user = userRepository.findById(ranking.getUserId()).orElse(new User());
            topRankers.add(RankingUserDto.builder()
                    .rank(rank++)
                    .userId(ranking.getUserId())
                    .nickname(user.getNickname())
                    .score(ranking.getTotalScore())
                    .badge("default")
                    .streakDays(ranking.getStreakDays())
                    .tier(ranking.getTier() != null ? ranking.getTier().name() : null)
                    .colorCode(ranking.getTier() != null ? ranking.getTier().getColorCode() : null)
                    .build());
        }

        // 2. 나의 랭킹 정보 조회
        UserRanking myRankingEntity = userRankingRepository.findByUserId(currentUserId)
                .orElseGet(() -> createDefaultRanking(currentUserId));
        // 내 랭킹의 실시간 순위 계산
        int myRank = 0;
        List<UserRanking> allRankings = userRankingRepository.findTopRankings(PageRequest.of(0, 1000)).getContent();
        for (int i = 0; i < allRankings.size(); i++) {
            if (allRankings.get(i).getUserId().equals(currentUserId)) {
                myRank = i + 1;
                break;
            }
        }
        MyRankingDto myRanking = MyRankingDto.builder()
                .rank(myRank)
                .score(myRankingEntity.getTotalScore())
                .streakDays(myRankingEntity.getStreakDays())
                .totalUsers(userRankingRepository.count())
                .tier(myRankingEntity.getTier() != null ? myRankingEntity.getTier().name() : null)
                .colorCode(myRankingEntity.getTier() != null ? myRankingEntity.getTier().getColorCode() : null)
                .build();

        // 3. 최종 응답 생성
        return RankingResponseDto.builder()
                .topRankers(topRankers)
                .myRanking(myRanking)
                .build();
    }

    @Transactional(readOnly = true)
    public MyRankingResponseDto getMyRanking() {
        User currentUser = getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        UserRanking myRankingEntity = userRankingRepository.findByUserId(currentUserId)
                .orElseGet(() -> createDefaultRanking(currentUserId));
        return MyRankingResponseDto.builder()
                .rank(myRankingEntity.getRankPosition())
                .score(myRankingEntity.getTotalScore())
                .streakDays(myRankingEntity.getStreakDays())
                .totalUsers(userRankingRepository.count())
                .userId(currentUserId)
                .nickname(currentUser.getNickname())
                .tier(myRankingEntity.getTier() != null ? myRankingEntity.getTier().name() : null)
                .colorCode(myRankingEntity.getTier() != null ? myRankingEntity.getTier().getColorCode() : null)
                .build();
    }

    @Transactional(readOnly = true)
    public List<RankingUserDto> getSeasonRankings(int season) {
        List<UserRanking> seasonRankings = userRankingRepository.findAllBySeasonOrderByTotalScoreDesc(season, PageRequest.of(0, 10)).getContent();
        return seasonRankings.stream()
                .map(ranking -> {
                    User user = userRepository.findById(ranking.getUserId()).orElse(new User());
                    return RankingUserDto.builder()
                            .rank(ranking.getRankPosition())
                            .userId(ranking.getUserId())
                            .nickname(user.getNickname())
                            .score(ranking.getTotalScore())
                            .badge("default")
                            .streakDays(ranking.getStreakDays())
                            .tier(ranking.getTier() != null ? ranking.getTier().name() : null)
                            .colorCode(ranking.getTier() != null ? ranking.getTier().getColorCode() : null)
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RankingUserDto> getPeriodRankings(String periodType) {
        // 최근 기록 기준, ranking_history에서 periodType별로 상위 10명 추출
        List<com.lifebit.coreapi.entity.RankingHistory> histories = rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType, PageRequest.of(0, 10)).getContent();
        return histories.stream()
                .map(history -> {
                    UserRanking ranking = history.getUserRanking();
                    User user = userRepository.findById(ranking.getUserId()).orElse(new User());
                    return RankingUserDto.builder()
                            .rank(history.getRankPosition())
                            .userId(ranking.getUserId())
                            .nickname(user.getNickname())
                            .score(history.getTotalScore())
                            .badge("default")
                            .streakDays(history.getStreakDays())
                            .tier(ranking.getTier() != null ? ranking.getTier().name() : null)
                            .colorCode(ranking.getTier() != null ? ranking.getTier().getColorCode() : null)
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RankingUserDto> getTopRankings() {
        List<UserRanking> topRankings = userRankingRepository.findTopRankings(PageRequest.of(0, 10)).getContent();
        return topRankings.stream()
                .map(ranking -> {
                    User user = userRepository.findById(ranking.getUserId()).orElse(new User());
                    return RankingUserDto.builder()
                            .rank(ranking.getRankPosition())
                            .userId(ranking.getUserId())
                            .nickname(user.getNickname())
                            .score(ranking.getTotalScore())
                            .badge("default")
                            .streakDays(ranking.getStreakDays())
                            .tier(ranking.getTier() != null ? ranking.getTier().name() : null)
                            .colorCode(ranking.getTier() != null ? ranking.getTier().getColorCode() : null)
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.List<RankingHistoryDto> getRankingHistory(String periodType, Integer season) {
        java.util.List<com.lifebit.coreapi.entity.RankingHistory> histories;
        if (periodType != null && season != null) {
            histories = rankingHistoryRepository.findByPeriodTypeAndSeasonOrderByRecordedAtDesc(periodType, season);
        } else if (periodType != null) {
            histories = rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType, org.springframework.data.domain.PageRequest.of(0, 30)).getContent();
        } else if (season != null) {
            histories = rankingHistoryRepository.findBySeasonOrderByRecordedAtDesc(season, org.springframework.data.domain.PageRequest.of(0, 30)).getContent();
        } else {
            histories = rankingHistoryRepository.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "recordedAt"));
        }
        return histories.stream().map(h -> RankingHistoryDto.builder()
                .recordedAt(h.getRecordedAt())
                .totalScore(h.getTotalScore())
                .rankPosition(h.getRankPosition())
                .streakDays(h.getStreakDays())
                .season(h.getSeason())
                .periodType(h.getPeriodType())
                .tier(h.getUserRanking() != null && h.getUserRanking().getTier() != null ? h.getUserRanking().getTier().name() : null)
                .colorCode(h.getUserRanking() != null && h.getUserRanking().getTier() != null ? h.getUserRanking().getTier().getColorCode() : null)
                .build()).collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RankingStatsDto getRankingStats() {
        User currentUser = getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        UserRanking myRankingEntity = userRankingRepository.findByUserId(currentUserId)
                .orElseGet(() -> createDefaultRanking(currentUserId));
        return RankingStatsDto.builder()
                .totalRankings(userRankingRepository.count())
                .myRank(myRankingEntity.getRankPosition())
                .myTotalScore(myRankingEntity.getTotalScore())
                .myStreakDays(myRankingEntity.getStreakDays())
                .build();
    }

    @Transactional(readOnly = true)
    public java.util.List<RankingRewardDto> getSeasonRewards(int season) {
        // 예시: 시즌 상위 3명에게만 보상 지급
        java.util.List<UserRanking> seasonRankings = userRankingRepository.findAllBySeasonOrderByTotalScoreDesc(season, org.springframework.data.domain.PageRequest.of(0, 3)).getContent();
        int[] rewards = {10000, 5000, 2000};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < seasonRankings.size(); i++) {
            UserRanking ranking = seasonRankings.get(i);
            com.lifebit.coreapi.entity.User user = userRepository.findById(ranking.getUserId()).orElse(new com.lifebit.coreapi.entity.User());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user.getNickname())
                    .rankPosition(ranking.getRankPosition())
                    .totalScore(ranking.getTotalScore())
                    .rewardType("season")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public java.util.List<RankingRewardDto> getPeriodRewards(String periodType) {
        // 예시: 기간 상위 3명에게만 보상 지급
        java.util.List<com.lifebit.coreapi.entity.RankingHistory> histories = rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType, org.springframework.data.domain.PageRequest.of(0, 3)).getContent();
        int[] rewards = {3000, 2000, 1000};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < histories.size(); i++) {
            com.lifebit.coreapi.entity.RankingHistory history = histories.get(i);
            UserRanking ranking = history.getUserRanking();
            com.lifebit.coreapi.entity.User user = userRepository.findById(ranking.getUserId()).orElse(new com.lifebit.coreapi.entity.User());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user.getNickname())
                    .rankPosition(history.getRankPosition())
                    .totalScore(history.getTotalScore())
                    .rewardType("period")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public java.util.List<RankingRewardDto> getStreakRewards() {
        // 예시: 연속 기록 상위 3명에게만 보상 지급
        java.util.List<UserRanking> streakRankings = userRankingRepository.findTopRankingsByStreakDays(org.springframework.data.domain.PageRequest.of(0, 3));
        int[] rewards = {2000, 1000, 500};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < streakRankings.size(); i++) {
            UserRanking ranking = streakRankings.get(i);
            com.lifebit.coreapi.entity.User user = userRepository.findById(ranking.getUserId()).orElse(new com.lifebit.coreapi.entity.User());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user.getNickname())
                    .rankPosition(ranking.getRankPosition())
                    .totalScore(ranking.getTotalScore())
                    .rewardType("streak")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public RankingRewardDto getMyReward() {
        User currentUser = getCurrentUser();
        Long currentUserId = currentUser.getUserId();
        UserRanking myRanking = userRankingRepository.findByUserId(currentUserId).orElseGet(() -> createDefaultRanking(currentUserId));
        // 예시: 내 순위에 따라 보상 계산
        int reward = 0;
        if (myRanking.getRankPosition() == 1) reward = 10000;
        else if (myRanking.getRankPosition() == 2) reward = 5000;
        else if (myRanking.getRankPosition() == 3) reward = 2000;
        return RankingRewardDto.builder()
                .userId(currentUserId)
                .nickname(currentUser.getNickname())
                .rankPosition(myRanking.getRankPosition())
                .totalScore(myRanking.getTotalScore())
                .rewardType("personal")
                .rewardPoints(reward)
                .build();
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("User is not authenticated.");
        }
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("User not found in repository."));
    }

    private UserRanking createDefaultRanking(Long userId) {
        UserRanking ranking = new UserRanking();
        ranking.setUserId(userId);
        ranking.setTotalScore(0);
        ranking.setRankPosition(0);
        ranking.setStreakDays(0);
        ranking.setPreviousRank(0);
        ranking.setSeason(1); // 기본 시즌
        ranking.setActive(true);
        return userRankingRepository.save(ranking);
    }

    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void scheduledRankingUpdate() {
        log.info("[스케줄러] 전체 사용자 랭킹 자동 갱신 시작");
        List<UserRanking> allRankings = userRankingRepository.findAll();
        int rank = 1;
        for (UserRanking ranking : allRankings) {
            int prevScore = ranking.getTotalScore();
            RankingTier prevTier = ranking.getTier();

            // 1. 점수/등급 재계산
            int newScore = calculateTotalScore(ranking.getUserId());
            RankingTier newTier = calculateTier(newScore);
            ranking.setPreviousRank(ranking.getRankPosition());
            ranking.setRankPosition(rank++);
            ranking.setTotalScore(newScore);
            ranking.setTier(newTier);
            ranking.setLastUpdatedAt(LocalDateTime.now());

            // 2. 등급 변화 감지 시 알림 전송
            if (prevTier != newTier) {
                try {
                    notificationService.saveNotification(ranking.getUserId(), "TIER_CHANGE", "등급 변화 알림", String.format("등급이 %s에서 %s로 변경되었습니다.", prevTier.name(), newTier.name()));
                } catch (Exception e) {
                    log.warn("등급 변화 알림 전송 실패: userId={}, {} -> {}", ranking.getUserId(), prevTier, newTier);
                }
            }
        }
        userRankingRepository.saveAll(allRankings);
        log.info("[스케줄러] 전체 사용자 랭킹 자동 갱신 완료: {}명", allRankings.size());
    }

    /**
     * 랭킹 점수 산정 공식 적용 (운동, 식단, 출석, 업적)
     * 실제 도메인 서비스의 데이터를 직접 활용하여 점수 산정
     */
    public int calculateTotalScore(Long userId) {
        // 1. 운동 점수: 최근 7일간 총 운동 시간(분) ×2 + 칼로리 소모(0.5)
        int exerciseMinutes = exerciseService.getExerciseMinutesByPeriod(userId, 7); // 실제 기록
        int caloriesBurned = exerciseService.getCaloriesBurnedByPeriod(userId, 7);   // 실제 기록
        int exerciseScore = exerciseMinutes * 2 + (int)(caloriesBurned * 0.5);

        // 2. 식단 점수: 최근 7일간 목표 영양소 달성률(%) ×1
        // 예시: MealService에 getWeeklyNutritionAchievementRate(Long userId) 메서드가 있다고 가정
        int mealAchievementRate = 0;
        try {
            mealAchievementRate = mealService.getWeeklyNutritionAchievementRate(userId); // 실제 기록 기반
        } catch (Exception e) {
            // 예외 발생 시 0점 처리
        }
        int mealScore = mealAchievementRate;

        // 3. 출석 점수: streakDays ×10 (UserRanking의 streakDays)
        int streakDays = userRankingRepository.findByUserId(userId).map(UserRanking::getStreakDays).orElse(0);
        int streakScore = streakDays * 10;

        // 4. 업적 점수: 달성 업적 개수 ×50
        // UserAchievementRepository를 직접 사용하여 달성된 업적 개수 계산
        int achievementCount = userAchievementRepository.countAchievedByUserId(userId).intValue();
        int achievementScore = achievementCount * 50;

        return exerciseScore + mealScore + streakScore + achievementScore;
    }

    /**
     * 랭킹 등급 산정 (점수 기준)
     */
    public RankingTier calculateTier(int totalScore) {
        if (totalScore == 0) return RankingTier.UNRANK;
        if (totalScore < 1000) return RankingTier.BRONZE;
        if (totalScore < 2000) return RankingTier.SILVER;
        if (totalScore < 3000) return RankingTier.GOLD;
        if (totalScore < 4000) return RankingTier.PLATINUM;
        if (totalScore < 5000) return RankingTier.DIAMOND;
        if (totalScore < 6000) return RankingTier.MASTER;
        if (totalScore < 7000) return RankingTier.GRANDMASTER;
        return RankingTier.CHALLENGER;
    }

    /**
     * 시즌 종료 시 전체 유저 랭킹을 ranking_history에 저장하고 user_ranking을 초기화
     */
    @Transactional
    public void closeSeasonAndResetRankings() {
        int currentSeason = getCurrentSeason(); // 현재 시즌 번호(임시)
        List<UserRanking> allRankings = userRankingRepository.findAll();
        // 1. 모든 유저의 랭킹 정보를 ranking_history에 저장
        for (UserRanking ranking : allRankings) {
            RankingHistory history = new RankingHistory();
            history.setUserRanking(ranking);
            history.setTotalScore(ranking.getTotalScore());
            history.setStreakDays(ranking.getStreakDays());
            history.setRankPosition(ranking.getRankPosition());
            history.setSeason(currentSeason);
            history.setPeriodType("season");
            history.setRecordedAt(java.time.LocalDateTime.now());
            rankingHistoryRepository.save(history);
        }
        // 시즌 종료 알림 전송 (한 번만 호출, 내부에서 상위 랭커 전체 알림)
        try {
            notificationService.saveNotification(null, "SEASON_END", "시즌 종료 알림", String.format("%d 시즌이 종료되었습니다.", currentSeason));
        } catch (Exception e) {
            log.warn("시즌 종료 알림 전송 실패: season={}", currentSeason);
        }
        // 2. user_ranking 초기화(시즌+1, 점수/순위/연속일수 등 0)
        for (UserRanking ranking : allRankings) {
            ranking.setSeason(currentSeason + 1);
            ranking.setTotalScore(0);
            ranking.setRankPosition(0);
            ranking.setStreakDays(0);
            ranking.setPreviousRank(0);
            ranking.setTier(RankingTier.UNRANK);
            ranking.setLastUpdatedAt(java.time.LocalDateTime.now());
        }
        userRankingRepository.saveAll(allRankings);
    }

    // 임시: 현재 시즌 번호 반환
    private int getCurrentSeason() {
        return 1;
    }

    /**
     * (예시) 관리자/운영자용 시즌 종료 수동 트리거 API
     * 실제 운영에서는 RankingController 등에 @PostMapping("/admin/season/close") 등으로 노출
     */
    public void triggerSeasonClose() {
        closeSeasonAndResetRankings();
    }

    /**
     * 목표 달성률 기반 점수 업데이트
     */
    @Transactional
    public void updateGoalAchievementScore(Long userId) {
        try {
            log.info("목표 달성률 점수 업데이트 시작 - 사용자 ID: {}", userId);
            
            UserRanking userRanking = userRankingRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserRanking newRanking = new UserRanking();
                        newRanking.setUserId(userId);
                        newRanking.setTotalScore(0);
                        newRanking.setTier(RankingTier.BRONZE);
                        newRanking.setCreatedAt(LocalDateTime.now());
                        return userRankingRepository.save(newRanking);
                    });

            // ✅ 전체 점수 재계산 (운동, 식단, 출석, 업적 포함)
            int totalScore = calculateTotalScore(userId);
            
            // ✅ 점수 교체 (누적 방지)
            userRanking.setTotalScore(totalScore);
            userRanking.setLastUpdatedAt(LocalDateTime.now());
            
            // 티어 업데이트
            RankingTier newTier = calculateTier(totalScore);
            userRanking.setTier(newTier);
            
            userRankingRepository.save(userRanking);
            
            // ✅ 개별 사용자 랭킹 순위 업데이트 (성능 최적화)
            updateUserRankingPosition(userId);
            
            log.info("목표 달성률 점수 업데이트 완료 - 사용자 ID: {}, 총 점수: {}", 
                    userId, totalScore);
                    
        } catch (Exception e) {
            log.error("목표 달성률 점수 업데이트 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            throw new RuntimeException("목표 달성률 점수 업데이트에 실패했습니다.", e);
        }
    }

    /**
     * 운동 점수만 업데이트 (주간 기준)
     */
    @Transactional
    public void updateExerciseScore(Long userId) {
        try {
            log.info("운동 점수 업데이트 시작 - 사용자 ID: {}", userId);
            
            UserRanking userRanking = userRankingRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserRanking newRanking = new UserRanking();
                        newRanking.setUserId(userId);
                        newRanking.setTotalScore(0);
                        newRanking.setTier(RankingTier.BRONZE);
                        newRanking.setCreatedAt(LocalDateTime.now());
                        return userRankingRepository.save(newRanking);
                    });

            // 전체 점수 재계산 (운동 점수만 업데이트하지만 전체 점수로 랭킹을 매기므로)
            int totalScore = calculateTotalScore(userId);
            
            userRanking.setTotalScore(totalScore);
            userRanking.setLastUpdatedAt(LocalDateTime.now());
            
            // 티어 업데이트
            RankingTier newTier = calculateTier(totalScore);
            userRanking.setTier(newTier);
            
            userRankingRepository.save(userRanking);
            
            // 개별 사용자 랭킹 순위 업데이트
            updateUserRankingPosition(userId);
            
            log.info("운동 점수 업데이트 완료 - 사용자 ID: {}, 총 점수: {}", 
                    userId, totalScore);
                    
        } catch (Exception e) {
            log.error("운동 점수 업데이트 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            throw new RuntimeException("운동 점수 업데이트에 실패했습니다.", e);
        }
    }

    /**
     * 식단 점수만 업데이트 (일간 기준)
     */
    @Transactional
    public void updateNutritionScore(Long userId) {
        try {
            log.info("식단 점수 업데이트 시작 - 사용자 ID: {}", userId);
            
            UserRanking userRanking = userRankingRepository.findByUserId(userId)
                    .orElseGet(() -> {
                        UserRanking newRanking = new UserRanking();
                        newRanking.setUserId(userId);
                        newRanking.setTotalScore(0);
                        newRanking.setTier(RankingTier.BRONZE);
                        newRanking.setCreatedAt(LocalDateTime.now());
                        return userRankingRepository.save(newRanking);
                    });

            // 전체 점수 재계산 (식단 점수만 업데이트하지만 전체 점수로 랭킹을 매기므로)
            int totalScore = calculateTotalScore(userId);
            
            userRanking.setTotalScore(totalScore);
            userRanking.setLastUpdatedAt(LocalDateTime.now());
            
            // 티어 업데이트
            RankingTier newTier = calculateTier(totalScore);
            userRanking.setTier(newTier);
            
            userRankingRepository.save(userRanking);
            
            // 개별 사용자 랭킹 순위 업데이트
            updateUserRankingPosition(userId);
            
            log.info("식단 점수 업데이트 완료 - 사용자 ID: {}, 총 점수: {}", 
                    userId, totalScore);
                    
        } catch (Exception e) {
            log.error("식단 점수 업데이트 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            throw new RuntimeException("식단 점수 업데이트에 실패했습니다.", e);
        }
    }

    /**
     * 개별 사용자의 랭킹 순위만 업데이트 (성능 최적화)
     */
    @Transactional
    public void updateUserRankingPosition(Long userId) {
        try {
            log.info("개별 사용자 랭킹 순위 업데이트 시작 - 사용자 ID: {}", userId);
            
            // 현재 사용자의 점수 조회
            UserRanking currentUserRanking = userRankingRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("User ranking not found: " + userId));
            
            // 전체 사용자 중 현재 사용자보다 높은 점수를 가진 사용자 수 계산
            long higherScoreCount = userRankingRepository.findAll()
                    .stream()
                    .filter(UserRanking::isActive)
                    .filter(ranking -> ranking.getTotalScore() > currentUserRanking.getTotalScore())
                    .count();
            
            // 새 순위 = 더 높은 점수 사용자 수 + 1
            int newRank = (int) higherScoreCount + 1;
            
            // 이전 순위 저장
            currentUserRanking.setPreviousRank(currentUserRanking.getRankPosition());
            currentUserRanking.setRankPosition(newRank);
            currentUserRanking.setLastUpdatedAt(LocalDateTime.now());
            
            userRankingRepository.save(currentUserRanking);
            
            log.info("개별 사용자 랭킹 순위 업데이트 완료 - 사용자 ID: {}, 새 순위: {}", userId, newRank);
            
        } catch (Exception e) {
            log.error("개별 사용자 랭킹 순위 업데이트 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            throw new RuntimeException("개별 사용자 랭킹 순위 업데이트에 실패했습니다.", e);
        }
    }

    /**
     * 전체 사용자의 랭킹 순위 업데이트 (수동 호출용)
     * 점수 순으로 정렬하여 순위를 재계산
     */
    @Transactional
    public void updateRankingPositions() {
        try {
            log.info("전체 랭킹 순위 업데이트 시작");
            
            // 모든 활성 사용자 랭킹을 점수 순으로 조회
            List<UserRanking> allRankings = userRankingRepository.findAll()
                    .stream()
                    .filter(UserRanking::isActive)
                    .sorted((a, b) -> Integer.compare(b.getTotalScore(), a.getTotalScore()))
                    .collect(java.util.stream.Collectors.toList());
            
            int rank = 1;
            for (UserRanking ranking : allRankings) {
                // 이전 순위 저장
                ranking.setPreviousRank(ranking.getRankPosition());
                // 새 순위 설정
                ranking.setRankPosition(rank++);
                ranking.setLastUpdatedAt(LocalDateTime.now());
            }
            
            // 변경사항 저장
            userRankingRepository.saveAll(allRankings);
            
            log.info("전체 랭킹 순위 업데이트 완료 - 총 {}명", allRankings.size());
            
        } catch (Exception e) {
            log.error("전체 랭킹 순위 업데이트 실패: {}", e.getMessage(), e);
            throw new RuntimeException("전체 랭킹 순위 업데이트에 실패했습니다.", e);
        }
    }

    /**
     * 운동 목표 점수 계산 (주별 최대 7점)
     * weekly_workout_target과 주간 총 세트 수 비교
     */
    private int calculateExerciseGoalScore(Long userId) {
        try {
            // 사용자 목표 조회
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(userId);
            
            if (userGoal == null || userGoal.getWeeklyWorkoutTarget() == null || userGoal.getWeeklyWorkoutTarget() <= 0) {
                log.info("운동 목표가 설정되지 않음 - 사용자 ID: {}", userId);
                return 0;
            }
            
            // 주간 총 운동 세트 수 조회
            int weeklyTotalSets = exerciseService.getWeeklyTotalSets(userId);
            int weeklyTarget = userGoal.getWeeklyWorkoutTarget();
            
            // 달성률 계산
            double achievementRate = Math.min((double) weeklyTotalSets / weeklyTarget, 1.0);
            
            // 달성률에 따른 점수 계산 (주별 최대 7점)
            int score = (int) Math.round(achievementRate * 7);
            
            log.info("운동 목표 점수 계산 - 사용자 ID: {}, 목표: {}세트, 달성: {}세트, 달성률: {:.1%}, 점수: {}", 
                    userId, weeklyTarget, weeklyTotalSets, achievementRate, score);
            
            return score;
            
        } catch (Exception e) {
            log.error("운동 목표 점수 계산 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            return 0;
        }
    }

    /**
     * 식단 목표 점수 계산 (주별 최대 7점)
     * 하루 식단 100% 달성 시 1점, 주별 최대 7점
     */
    private int calculateNutritionGoalScore(Long userId) {
        try {
            // 사용자 목표 조회
            UserGoal userGoal = userGoalService.getUserGoalOrDefault(userId);
            
            if (userGoal == null) {
                log.info("식단 목표가 설정되지 않음 - 사용자 ID: {}", userId);
                return 0;
            }
            
            int totalDaysScore = 0;
            
            // 지난 7일간 각 날짜별로 식단 목표 달성 여부 확인
            for (int i = 0; i < 7; i++) {
                LocalDate checkDate = LocalDate.now().minusDays(i);
                
                // 해당 날짜의 영양소 섭취량 조회
                Map<String, Object> dailyNutrition = getDailyNutritionIntake(userId, checkDate);
                
                double carbsIntake = ((Number) dailyNutrition.getOrDefault("totalCarbs", 0)).doubleValue();
                double proteinIntake = ((Number) dailyNutrition.getOrDefault("totalProtein", 0)).doubleValue();
                double fatIntake = ((Number) dailyNutrition.getOrDefault("totalFat", 0)).doubleValue();
                
                // 목표 대비 달성률 계산
                double carbsRate = userGoal.getDailyCarbsTarget() != null && userGoal.getDailyCarbsTarget() > 0 
                    ? carbsIntake / userGoal.getDailyCarbsTarget() : 0;
                double proteinRate = userGoal.getDailyProteinTarget() != null && userGoal.getDailyProteinTarget() > 0 
                    ? proteinIntake / userGoal.getDailyProteinTarget() : 0;
                double fatRate = userGoal.getDailyFatTarget() != null && userGoal.getDailyFatTarget() > 0 
                    ? fatIntake / userGoal.getDailyFatTarget() : 0;
                
                // 모든 영양소가 100% 이상 달성되면 해당 날짜 1점
                if (carbsRate >= 1.0 && proteinRate >= 1.0 && fatRate >= 1.0) {
                    totalDaysScore++;
                    log.info("식단 목표 달성 - 사용자 ID: {}, 날짜: {}, 탄수화물: {:.1%}, 단백질: {:.1%}, 지방: {:.1%}", 
                            userId, checkDate, carbsRate, proteinRate, fatRate);
                }
            }
            
            log.info("식단 목표 점수 계산 완료 - 사용자 ID: {}, 달성 일수: {}일, 점수: {}점", 
                    userId, totalDaysScore, totalDaysScore);
            
            return totalDaysScore;
            
        } catch (Exception e) {
            log.error("식단 목표 점수 계산 실패 - 사용자 ID: {}, 오류: {}", userId, e.getMessage(), e);
            return 0;
        }
    }
    
    /**
     * 특정 날짜의 일일 영양소 섭취량 조회
     */
    private Map<String, Object> getDailyNutritionIntake(Long userId, LocalDate date) {
        Map<String, Object> result = new HashMap<>();
        result.put("totalCarbs", 0.0);
        result.put("totalProtein", 0.0);
        result.put("totalFat", 0.0);
        result.put("totalCalories", 0.0);
        
        try {
            List<MealLog> mealLogs = mealLogRepository.findByUserIdAndLogDateOrderByLogDateDescCreatedAtDesc(userId, date);
            
            double totalCarbs = 0.0;
            double totalProtein = 0.0;
            double totalFat = 0.0;
            double totalCalories = 0.0;
            
            for (MealLog mealLog : mealLogs) {
                if (mealLog.getFoodItem() != null) {
                    FoodItem foodItem = mealLog.getFoodItem();
                    double quantity = mealLog.getQuantity() != null ? mealLog.getQuantity().doubleValue() : 0.0;
                    
                    totalCarbs += foodItem.getCarbs() != null ? foodItem.getCarbs().doubleValue() * quantity / 100 : 0.0;
                    totalProtein += foodItem.getProtein() != null ? foodItem.getProtein().doubleValue() * quantity / 100 : 0.0;
                    totalFat += foodItem.getFat() != null ? foodItem.getFat().doubleValue() * quantity / 100 : 0.0;
                    totalCalories += foodItem.getCalories() != null ? foodItem.getCalories().doubleValue() * quantity / 100 : 0.0;
                }
            }
            
            result.put("totalCarbs", totalCarbs);
            result.put("totalProtein", totalProtein);
            result.put("totalFat", totalFat);
            result.put("totalCalories", totalCalories);
            
        } catch (Exception e) {
            log.error("일일 영양소 섭취량 조회 실패 - 사용자 ID: {}, 날짜: {}, 오류: {}", userId, date, e.getMessage());
        }
        
        return result;
    }

    /**
     * 업적 달성 완료 이벤트 리스너
     */
    @EventListener
    @Transactional
    public void handleAchievementCompleted(AchievementCompletedEvent event) {
        try {
            log.info("📢 [RankingService] 업적 달성 이벤트 수신 - 사용자: {}", event.getUserId());
            updateGoalAchievementScore(event.getUserId());
            log.info("✅ [RankingService] 랭킹 점수 업데이트 완료 - 사용자: {}", event.getUserId());
        } catch (Exception e) {
            log.error("❌ [RankingService] 업적 달성 후 랭킹 점수 업데이트 실패 - 사용자: {}, 오류: {}", event.getUserId(), e.getMessage(), e);
        }
    }
} 