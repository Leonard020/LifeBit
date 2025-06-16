package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_sessions")
@Getter @Setter
public class ExerciseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long exerciseSessionId;
    
    private UUID uuid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_catalog_id")
    private ExerciseCatalog exerciseCatalog;
    
    private Integer durationMinutes;
    private Integer caloriesBurned;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    private LocalDate exerciseDate;
    private LocalDateTime createdAt;
} 