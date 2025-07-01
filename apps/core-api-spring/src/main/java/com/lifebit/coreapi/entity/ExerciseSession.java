package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_sessions",
    indexes = {
        @Index(name = "idx_exercise_sessions_user_date", columnList = "user_id,exercise_date"),
        @Index(name = "idx_exercise_sessions_catalog", columnList = "exercise_catalog_id"),
        @Index(name = "idx_exercise_sessions_validation", columnList = "validation_status")
    }
)
@Getter @Setter
public class ExerciseSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "exercise_session_id")
    private Long exerciseSessionId;
    
    @Column(unique = true, nullable = false)
    private UUID uuid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exercise_catalog_id", nullable = true)
    private ExerciseCatalog exerciseCatalog;
    
    @Column(name = "duration_minutes")
    private Integer durationMinutes;
    @Column(name = "calories_burned")
    private Integer caloriesBurned;
    @Column(precision = 5, scale = 2)
    private BigDecimal weight;
    private Integer reps;
    private Integer sets;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    @Column(name = "exercise_date")
    private LocalDate exerciseDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "time_period")
    private TimePeriodType timePeriod;
    
    @Convert(converter = InputSourceTypeConverter.class)
    @Column(name = "input_source")
    private InputSourceType inputSource;
    
    @Column(name = "confidence_score", precision = 4, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(name = "original_audio_path")
    private String originalAudioPath;
    
    @Convert(converter = ValidationStatusTypeConverter.class)
    @Column(name = "validation_status")
    private ValidationStatusType validationStatus = ValidationStatusType.PENDING;
    
    @Column(name = "validation_notes")
    private String validationNotes;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
} 