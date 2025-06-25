package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification")
@Getter @Setter @NoArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, name = "user_id")
    private Long userId;

    @Column(nullable = true)
    private String type;

    @Column(nullable = true, name = "ref_id")
    private Long refId;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    @Column(nullable = false, name = "is_read")
    private boolean isRead = false;

    @Column(nullable = false, name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
} 