package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
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
    private BigDecimal weight;
    private Integer reps;
    private Integer sets;
    
    @Column(columnDefinition = "TEXT")
    private String notes;
    
    private LocalDate exerciseDate;
    
    @Convert(converter = InputSourceTypeConverter.class)
    @Column(name = "input_source")
    private InputSourceType inputSource;
    
    @Column(name = "confidence_score")
    private BigDecimal confidenceScore;
    
    @Column(name = "original_audio_path")
    private String originalAudioPath;
    
    @Convert(converter = ValidationStatusTypeConverter.class)
    @Column(name = "validation_status")
    private ValidationStatusType validationStatus;
    
    @Column(name = "validation_notes")
    private String validationNotes;
    
    private LocalDateTime createdAt;
} 