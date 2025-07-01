package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"email"}),
        @UniqueConstraint(columnNames = {"nickname"})
    },
    indexes = {
        @Index(name = "idx_users_email", columnList = "email"),
        @Index(name = "idx_users_nickname", columnList = "nickname"),
        @Index(name = "idx_users_provider", columnList = "provider")
    }
)
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long userId;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @Column(name = "provider", length = 50)
    private String provider;

    @Column(name = "nickname", unique = true, nullable = false, length = 100)
    private String nickname;

    @Column(name = "profile_image_url", length = 255)
    private String profileImageUrl;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;
    @Column(precision = 5, scale = 2)
    private BigDecimal weight;
    private Integer age;

    @Column(length = 10)
    private String gender;

    @Convert(converter = UserRoleConverter.class)
    @Column(name = "role", nullable = false)
    private UserRole role = UserRole.USER;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_visited")
    private LocalDateTime lastVisited;

    public User(Long userId) {
        this.userId = userId;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public void setGender(String gender) {
        if (gender != null && !gender.equals("male") && !gender.equals("female")) {
            throw new IllegalArgumentException("gender must be 'male' or 'female'");
        }
        this.gender = gender;
    }
} 