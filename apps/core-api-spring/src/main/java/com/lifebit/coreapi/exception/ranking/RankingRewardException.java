package com.lifebit.coreapi.exception.ranking;

public class RankingRewardException extends RankingException {
    public RankingRewardException(String message) {
        super(message);
    }

    public static RankingRewardException rewardNotFound(Long rewardId) {
        return new RankingRewardException(String.format("보상을 찾을 수 없습니다. (rewardId: %d)", rewardId));
    }

    public static RankingRewardException alreadyClaimed(Long rewardId) {
        return new RankingRewardException(String.format("이미 수령한 보상입니다. (rewardId: %d)", rewardId));
    }

    public static RankingRewardException notEligible(String reason) {
        return new RankingRewardException(String.format("보상을 수령할 수 없습니다. 사유: %s", reason));
    }
} 