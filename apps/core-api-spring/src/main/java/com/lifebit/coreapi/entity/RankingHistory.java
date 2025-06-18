package com.lifebit.coreapi.entity;

import com.lifebit.coreapi.entity.enums.PeriodType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "ranking_histories")
@Getter
@Setter
@NoArgsConstructor
public class RankingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userUuid;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private int totalScore;

    @Column(nullable = false)
    private int rankPosition;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PeriodType periodType;

    @Column(nullable = false)
    private int periodRank;

    @Column(nullable = false)
    private int periodPoints;

    @Column(nullable = false)
    private String season;

    @Column(nullable = false)
    private int seasonRank;

    @Column(nullable = false)
    private int seasonPoints;

    @Column(nullable = false)
    private int streakDays;

    @Column(nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    public void prePersist() {
        if (this.recordedAt == null) {
            this.recordedAt = LocalDateTime.now();
        }
    }

    public static RankingHistory fromUserRanking(UserRanking ranking) {
        RankingHistory history = new RankingHistory();
        history.setUserUuid(ranking.getUserUuid());
        history.setUsername(ranking.getUsername());
        history.setTotalScore(ranking.getTotalScore());
        history.setRankPosition(ranking.getRankPosition());
        history.setPeriodType(ranking.getPeriodType());
        history.setPeriodRank(ranking.getPeriodRank());
        history.setPeriodPoints(ranking.getPeriodPoints());
        history.setSeason(ranking.getSeason());
        history.setSeasonRank(ranking.getSeasonRank());
        history.setSeasonPoints(ranking.getSeasonPoints());
        history.setStreakDays(ranking.getStreakDays());
        return history;
    }
} 