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
@Table(name = "users")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(unique = true, nullable = false)
    private String nickname;

    private BigDecimal height;
    private BigDecimal weight;
    private Integer age;

    @Column(length = 10)
    private String gender;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", columnDefinition = "varchar(20)")
    private UserRole role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User(Long userId) {
        this.userId = userId;
    }

    @PrePersist
    protected void onCreate() {
        this.uuid = UUID.randomUUID();
        this.role = UserRole.USER;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
} 