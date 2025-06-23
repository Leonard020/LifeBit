package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "ranking_history")
@Getter
@Setter
@NoArgsConstructor
public class RankingHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_ranking_id", nullable = false)
    private UserRanking userRanking;

    @Column(name = "total_score", nullable = false)
    private int totalScore;

    @Column(name = "streak_days", nullable = false)
    private int streakDays;

    @Column(name = "rank_position", nullable = false)
    private int rankPosition;

    @Column(name = "season", nullable = false)
    private int season;

    @Column(name = "period_type", nullable = false, length = 10)
    private String periodType;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    public void prePersist() {
        if (this.recordedAt == null) {
            this.recordedAt = LocalDateTime.now();
        }
    }
} 