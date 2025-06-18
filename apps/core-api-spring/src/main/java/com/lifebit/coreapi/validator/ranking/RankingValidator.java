package com.lifebit.coreapi.validator.ranking;

import com.lifebit.coreapi.constant.ranking.RankingConstants;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingException;
import org.springframework.stereotype.Component;

@Component
public class RankingValidator {
    
    public void validateRanking(UserRanking ranking) {
        if (ranking == null) {
            throw new RankingException("랭킹 정보가 존재하지 않습니다.");
        }
        
        validatePoints(ranking.getTotalScore());
        validateRank(ranking.getRankPosition());
        validateStreakDays(ranking.getStreakDays());
    }
    
    public void validatePeriodType(PeriodType periodType) {
        if (periodType == null) {
            throw new RankingException("기간 타입이 올바르지 않습니다.");
        }
    }
    
    public void validateSeason(String season) {
        if (season == null || season.trim().isEmpty()) {
            throw new RankingException("시즌 정보가 올바르지 않습니다.");
        }
    }
    
    public void validatePoints(int points) {
        if (points < RankingConstants.MIN_SCORE || points > RankingConstants.MAX_SCORE) {
            throw new RankingException(
                String.format("점수는 %d에서 %d 사이여야 합니다.", 
                    RankingConstants.MIN_SCORE, 
                    RankingConstants.MAX_SCORE)
            );
        }
    }
    
    public void validateRank(int rank) {
        if (rank < RankingConstants.MIN_RANK) {
            throw new RankingException(
                String.format("순위는 %d 이상이어야 합니다.", RankingConstants.MIN_RANK)
            );
        }
    }
    
    public void validateStreakDays(int streakDays) {
        if (streakDays < RankingConstants.MIN_STREAK_DAYS || 
            streakDays > RankingConstants.MAX_STREAK_DAYS) {
            throw new RankingException(
                String.format("연속 기록 일수는 %d에서 %d 사이여야 합니다.", 
                    RankingConstants.MIN_STREAK_DAYS, 
                    RankingConstants.MAX_STREAK_DAYS)
            );
        }
    }
} 