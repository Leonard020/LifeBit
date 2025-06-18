package com.lifebit.coreapi.entity;

import com.lifebit.coreapi.entity.enums.PeriodType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_rankings")
@Getter
@Setter
@NoArgsConstructor
public class UserRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String userUuid;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private int totalScore;

    @Column(nullable = false)
    private int rankPosition;

    @Column(nullable = false)
    private int streakDays;

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
    private boolean isActive;

    @Column(name = "rank_change")
    private Integer rankChange;

    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PreUpdate
    protected void onUpdate() {
        lastUpdatedAt = LocalDateTime.now();
    }

    public void updateRanking(Integer newRank, Integer oldRank) {
        this.rankPosition = newRank;
        this.rankChange = oldRank != null ? oldRank - newRank : 0;
    }

    public void updatePeriodRanking(Integer newRank, Integer points) {
        this.periodRank = newRank;
        this.periodPoints = points;
    }

    public void updateSeasonRanking(Integer newRank, Integer points) {
        this.seasonRank = newRank;
        this.seasonPoints = points;
    }

    public void incrementStreakDays() {
        this.streakDays++;
    }

    public void resetStreakDays() {
        this.streakDays = 0;
    }

    public void addPoints(Integer points) {
        this.totalScore += points;
        this.periodPoints += points;
        this.seasonPoints += points;
    }

    @PrePersist
    protected void prePersist() {
        if (this.totalScore == 0) this.totalScore = 0;
        if (this.streakDays == 0) this.streakDays = 0;
        if (this.rankPosition == 0) this.rankPosition = 0;
        if (this.rankChange == null) this.rankChange = 0;
        if (this.periodType == null) this.periodType = PeriodType.WEEKLY;
        if (this.periodRank == 0) this.periodRank = 0;
        if (this.periodPoints == 0) this.periodPoints = 0;
        if (this.season == null) this.season = "Season 1";
        if (this.seasonRank == 0) this.seasonRank = 0;
        if (this.seasonPoints == 0) this.seasonPoints = 0;
        if (this.isActive == false) this.isActive = true;
    }
} 