package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.lifebit.coreapi.entity.enums.RankingTier;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_ranking",
    indexes = {
        @Index(name = "idx_user_ranking_user_id", columnList = "user_id"),
        @Index(name = "idx_user_ranking_total_score", columnList = "total_score DESC"),
        @Index(name = "idx_user_ranking_rank_position", columnList = "rank_position")
    }
)
@Getter
@Setter
@NoArgsConstructor
public class UserRanking {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "total_score", nullable = false)
    private int totalScore = 0;

    @Column(name = "streak_days", nullable = false)
    private int streakDays = 0;

    @Column(name = "rank_position", nullable = false)
    private int rankPosition = 0;

    @Column(name = "previous_rank", nullable = false)
    private int previousRank = 0;

    @Column(name = "season", nullable = false)
    private int season = 1;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "last_updated_at", nullable = false)
    private LocalDateTime lastUpdatedAt;

    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "tier", nullable = false)
    private RankingTier tier = RankingTier.UNRANK;
} 