package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.constant.ranking.RankingConstants;
import com.lifebit.coreapi.dto.ranking.RankingRewardDto;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingNotFoundException;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingHistoryRepository;
import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.validator.ranking.RankingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RankingRewardService {
    private final UserRankingRepository userRankingRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final UserService userService;
    private final RankingValidator rankingValidator;

    @Transactional(readOnly = true)
    public List<RankingRewardDto> getSeasonRewards(int season) {
        java.util.List<UserRanking> seasonRankings = userRankingRepository.findAllBySeasonOrderByTotalScoreDesc(season, org.springframework.data.domain.PageRequest.of(0, 3)).getContent();
        int[] rewards = {10000, 5000, 2000};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < seasonRankings.size(); i++) {
            UserRanking ranking = seasonRankings.get(i);
            com.lifebit.coreapi.entity.User user = userService.getUserById(ranking.getUserId());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user != null ? user.getNickname() : ("사용자" + ranking.getUserId()))
                    .rankPosition(i + 1)
                    .totalScore(ranking.getTotalScore())
                    .rewardType("season")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<RankingRewardDto> getPeriodRewards(String periodType) {
        // 기간별 상위 3명 보상
        // (periodType은 weekly, monthly 등 문자열)
        // ranking_history에서 periodType별로 상위 3명 추출
        java.util.List<com.lifebit.coreapi.entity.RankingHistory> histories = rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType, org.springframework.data.domain.PageRequest.of(0, 3)).getContent();
        int[] rewards = {3000, 2000, 1000};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < histories.size(); i++) {
            com.lifebit.coreapi.entity.RankingHistory history = histories.get(i);
            UserRanking ranking = history.getUserRanking();
            com.lifebit.coreapi.entity.User user = userService.getUserById(ranking.getUserId());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user != null ? user.getNickname() : ("사용자" + ranking.getUserId()))
                    .rankPosition(history.getRankPosition())
                    .totalScore(history.getTotalScore())
                    .rewardType("period")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<RankingRewardDto> getStreakRewards() {
        java.util.List<UserRanking> streakRankings = userRankingRepository.findTopRankingsByStreakDays(org.springframework.data.domain.PageRequest.of(0, 3));
        int[] rewards = {2000, 1000, 500};
        java.util.List<RankingRewardDto> result = new java.util.ArrayList<>();
        for (int i = 0; i < streakRankings.size(); i++) {
            UserRanking ranking = streakRankings.get(i);
            com.lifebit.coreapi.entity.User user = userService.getUserById(ranking.getUserId());
            result.add(RankingRewardDto.builder()
                    .userId(ranking.getUserId())
                    .nickname(user != null ? user.getNickname() : ("사용자" + ranking.getUserId()))
                    .rankPosition(i + 1)
                    .totalScore(ranking.getTotalScore())
                    .rewardType("streak")
                    .rewardPoints(rewards[i])
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public RankingRewardDto getMyReward(Long userId) {
        UserRanking myRanking = userRankingRepository.findByUserId(userId).orElseGet(() -> null);
        com.lifebit.coreapi.entity.User user = userService.getUserById(userId);
        int reward = 0;
        if (myRanking != null) {
            if (myRanking.getRankPosition() == 1) reward = 10000;
            else if (myRanking.getRankPosition() == 2) reward = 5000;
            else if (myRanking.getRankPosition() == 3) reward = 2000;
        }
        return RankingRewardDto.builder()
                .userId(userId)
                .nickname(user != null ? user.getNickname() : ("사용자" + userId))
                .rankPosition(myRanking != null ? myRanking.getRankPosition() : 0)
                .totalScore(myRanking != null ? myRanking.getTotalScore() : 0)
                .rewardType("personal")
                .rewardPoints(reward)
                .build();
    }

    private UserRanking findAndValidateRanking(Long userId) {
        UserRanking ranking = userRankingRepository.findByUserId(userId)
                .orElseThrow(() -> new RankingNotFoundException(userId));
        return ranking;
    }
} 