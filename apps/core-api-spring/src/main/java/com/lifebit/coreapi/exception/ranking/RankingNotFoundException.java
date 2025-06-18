package com.lifebit.coreapi.exception.ranking;

public class RankingNotFoundException extends RankingException {
    public RankingNotFoundException(String userUuid) {
        super(String.format("사용자(UUID: %s)의 랭킹 정보를 찾을 수 없습니다.", userUuid));
    }

    public RankingNotFoundException(String userUuid, String season) {
        super(String.format("사용자(UUID: %s)의 %s 시즌 랭킹 정보를 찾을 수 없습니다.", userUuid, season));
    }

    public RankingNotFoundException(String userUuid, String periodType, String season) {
        super(String.format("사용자(UUID: %s)의 %s %s 랭킹 정보를 찾을 수 없습니다.", userUuid, periodType, season));
    }
} 