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
    public void updateScore(Long userId, int score) {
        UserRanking ranking = findAndValidateRanking(userId);
        rankingValidator.validatePoints(score);
        ranking.setTotalScore(score);
        userRankingRepository.save(ranking);
    }

    @Transactional
    public void updateStreakDays(Long userId, int streakDays) {
        UserRanking ranking = findAndValidateRanking(userId);
        rankingValidator.validateStreakDays(streakDays);
        ranking.setStreakDays(streakDays);
        userRankingRepository.save(ranking);
    }

    @Transactional(readOnly = true)
    public int getTotalScore(Long userId) {
        return findAndValidateRanking(userId).getTotalScore();
    }

    @Transactional(readOnly = true)
    public int getStreakDays(Long userId) {
        return findAndValidateRanking(userId).getStreakDays();
    }

    private UserRanking findAndValidateRanking(Long userId) {
        UserRanking ranking = userRankingRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new RankingNotFoundException(userId));
        rankingValidator.validateRanking(ranking);
        return ranking;
    }
} 