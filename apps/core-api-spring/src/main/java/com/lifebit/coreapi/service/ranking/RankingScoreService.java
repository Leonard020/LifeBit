package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingNotFoundException;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.validator.ranking.RankingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RankingScoreService {
    private final UserRankingRepository userRankingRepository;
    private final RankingValidator rankingValidator;

    @Transactional
    public void updateScore(String userUuid, int score) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validatePoints(score);
        ranking.setTotalScore(score);
        userRankingRepository.save(ranking);
    }

    @Transactional
    public void updateStreakDays(String userUuid, int streakDays) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validateStreakDays(streakDays);
        ranking.setStreakDays(streakDays);
        userRankingRepository.save(ranking);
    }

    @Transactional
    public void updatePeriodRank(String userUuid, PeriodType periodType, int rank) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validatePeriodType(periodType);
        rankingValidator.validateRank(rank);
        ranking.setPeriodType(periodType);
        ranking.setPeriodRank(rank);
        userRankingRepository.save(ranking);
    }

    @Transactional
    public void updateSeasonRank(String userUuid, String season, int rank) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validateSeason(season);
        rankingValidator.validateRank(rank);
        ranking.setSeason(season);
        ranking.setSeasonRank(rank);
        userRankingRepository.save(ranking);
    }

    @Transactional
    public void resetPeriodRanking(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        userRankingRepository.resetPeriodRanking(periodType);
    }

    @Transactional
    public void resetSeasonRanking(String season) {
        rankingValidator.validateSeason(season);
        userRankingRepository.resetSeasonRanking(season);
    }

    @Transactional(readOnly = true)
    public int getTotalScore(String userUuid) {
        return findAndValidateRanking(userUuid).getTotalScore();
    }

    @Transactional(readOnly = true)
    public int getStreakDays(String userUuid) {
        return findAndValidateRanking(userUuid).getStreakDays();
    }

    @Transactional(readOnly = true)
    public int getPeriodRank(String userUuid, PeriodType periodType) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validatePeriodType(periodType);
        return ranking.getPeriodRank();
    }

    @Transactional(readOnly = true)
    public int getSeasonRank(String userUuid, String season) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        rankingValidator.validateSeason(season);
        return ranking.getSeasonRank();
    }

    private UserRanking findAndValidateRanking(String userUuid) {
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return ranking;
    }
} 