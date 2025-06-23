package com.lifebit.coreapi.entity.ranking;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

/**
 * 랭킹 알림 엔티티
 * - 알림 타입, 제목, 메시지, 읽음 여부, 생성일시 등 관리
 */
@Entity
@Table(name = "ranking_notifications")
@Getter @Setter @NoArgsConstructor
public class RankingNotification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "user_id")
    private Long userId;

    /** 알림 타입 (랭킹 변동, 보상, 업적 등) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type = NotificationType.RANK_CHANGE;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    /** 알림 타입 enum */
    public enum NotificationType {
        RANK_CHANGE, REWARD, ACHIEVEMENT, PERIOD_END, SEASON_END
    }
} 