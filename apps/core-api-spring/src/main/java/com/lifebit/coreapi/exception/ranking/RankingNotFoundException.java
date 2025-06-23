package com.lifebit.coreapi.exception.ranking;

public class RankingNotFoundException extends RankingException {
    public RankingNotFoundException(Long userId) {
        super(String.format("사용자(ID: %s)의 랭킹 정보를 찾을 수 없습니다.", userId));
    }

    public RankingNotFoundException(Long userId, String season) {
        super(String.format("사용자(ID: %s)의 %s 시즌 랭킹 정보를 찾을 수 없습니다.", userId, season));
    }

    public RankingNotFoundException(Long userId, String periodType, String season) {
        super(String.format("사용자(ID: %s)의 %s %s 랭킹 정보를 찾을 수 없습니다.", userId, periodType, season));
    }
} 