package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_logs",
    indexes = {
        @Index(name = "idx_meal_logs_user_date", columnList = "user_id,log_date"),
        @Index(name = "idx_meal_logs_food", columnList = "food_item_id"),
        @Index(name = "idx_meal_logs_validation", columnList = "validation_status")
    }
)
@Getter @Setter
public class MealLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "meal_log_id")
    private Long mealLogId;
    
    @Column(unique = true, nullable = false)
    private UUID uuid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "food_item_id", nullable = true)
    private FoodItem foodItem;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "meal_time", nullable = false)
    private MealTimeType mealTime;
    
    @Column(precision = 6, scale = 2)
    private BigDecimal quantity;
    
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;
    
    @Convert(converter = InputSourceTypeConverter.class)
    @Column(name = "input_source")
    private InputSourceType inputSource;
    
    @Column(name = "confidence_score", precision = 4, scale = 2)
    private BigDecimal confidenceScore;
    
    @Column(name = "original_audio_path", length = 255)
    private String originalAudioPath;
    
    @Convert(converter = ValidationStatusTypeConverter.class)
    @Column(name = "validation_status")
    private ValidationStatusType validationStatus = ValidationStatusType.PENDING;
    
    @Column(name = "validation_notes")
    private String validationNotes;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
} 