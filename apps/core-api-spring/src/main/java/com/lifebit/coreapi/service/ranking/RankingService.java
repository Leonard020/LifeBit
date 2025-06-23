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
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingHistoryRepository;
import com.lifebit.coreapi.repository.ranking.RankingNotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RankingService {

    private final UserRankingRepository userRankingRepository;
    private final UserRepository userRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final RankingNotificationRepository rankingNotificationRepository;

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
        List<UserRanking> allRankings = userRankingRepository.findAll(Sort.by(Sort.Direction.DESC, "totalScore"));

        int rank = 1;
        for (UserRanking ranking : allRankings) {
            ranking.setPreviousRank(ranking.getRankPosition());
            ranking.setRankPosition(rank++);
            ranking.setLastUpdatedAt(LocalDateTime.now());
        }
        userRankingRepository.saveAll(allRankings);
        log.info("[스케줄러] 전체 사용자 랭킹 자동 갱신 완료: {}명", allRankings.size());
    }
} 