package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
<<<<<<< HEAD

=======
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
>>>>>>> home01
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
<<<<<<< HEAD
@Getter
@Setter
=======
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
>>>>>>> home01
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;
<<<<<<< HEAD

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(unique = true, nullable = false)
    private String nickname;

    private Double height;
    private Double weight;
    private Integer age;

    @Column(length = 10)
    private String gender;

    @Column(columnDefinition = "user_role")
    private String role;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.uuid = UUID.randomUUID();
        this.role = "USER";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
=======
    
    private UUID uuid;
    
    @Column(unique = true, nullable = false)
    private String email;
    
    private String passwordHash;
    
    @Column(unique = true, nullable = false)
    private String nickname;
    
    private BigDecimal height;
    private BigDecimal weight;
    private Integer age;
    
    @Column(length = 10)
    private String gender;
    
    @Enumerated(EnumType.STRING)
    private UserRole role;
    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public User(Long userId) {
        this.userId = userId;
>>>>>>> home01
    }
} 