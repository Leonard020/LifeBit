package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.constant.ranking.RankingConstants;
import com.lifebit.coreapi.dto.ranking.RankingRewardResponse;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingNotFoundException;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
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
    private final RankingValidator rankingValidator;

    @Transactional(readOnly = true)
    public List<RankingRewardResponse> getSeasonRewards(String season) {
        rankingValidator.validateSeason(season);
        return userRankingRepository.findTopRankingsBySeason(
                season,
                org.springframework.data.domain.PageRequest.of(0, RankingConstants.TOP_RANK_REWARD)
        )
        .stream()
        .map(this::createReward)
        .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RankingRewardResponse> getPeriodRewards(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        return userRankingRepository.findTopRankingsByPeriodType(
                periodType,
                org.springframework.data.domain.PageRequest.of(0, RankingConstants.TOP_RANK_REWARD)
        )
        .stream()
        .map(this::createReward)
        .collect(java.util.stream.Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RankingRewardResponse> getStreakRewards() {
        return userRankingRepository.findTopRankingsByStreakDays(RankingConstants.TOP_STREAK_REWARD)
                .stream()
                .map(this::createReward)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RankingRewardResponse getMyReward(String userUuid) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        return createReward(ranking);
    }

    private RankingRewardResponse createReward(UserRanking ranking) {
        return RankingRewardResponse.builder()
                .userUuid(ranking.getUserUuid())
                .username(ranking.getUsername())
                .rankPosition(ranking.getRankPosition())
                .totalScore(ranking.getTotalScore())
                .streakDays(ranking.getStreakDays())
                .periodType(ranking.getPeriodType())
                .periodRank(ranking.getPeriodRank())
                .periodPoints(ranking.getPeriodPoints())
                .season(ranking.getSeason())
                .seasonRank(ranking.getSeasonRank())
                .seasonPoints(ranking.getSeasonPoints())
                .build();
    }

    private UserRanking findAndValidateRanking(String userUuid) {
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return ranking;
    }
} 