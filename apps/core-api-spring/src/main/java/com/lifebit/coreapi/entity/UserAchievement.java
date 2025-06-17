package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_achievements")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserAchievement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userAchievementId;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "achievement_id", nullable = false)
    private Achievement achievement;

    @Column(name = "is_achieved")
    private Boolean isAchieved = false;

    private Integer progress = 0;

    private LocalDate achievedDate;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.uuid = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        if (this.isAchieved == null) {
            this.isAchieved = false;
        }
        if (this.progress == null) {
            this.progress = 0;
        }
    }

    // 유니크 제약 조건
    @Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "achievement_id"})
    })
    public static class UserAchievementConstraint {}
} 