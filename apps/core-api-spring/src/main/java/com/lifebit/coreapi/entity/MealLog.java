package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "meal_logs")
@Getter @Setter
public class MealLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long mealLogId;
    
    private UUID uuid;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "food_item_id")
    private FoodItem foodItem;
    
    private BigDecimal quantity;
    
    @Column(name = "log_date", nullable = false)
    private LocalDate logDate;
    
    @Convert(converter = MealTimeTypeConverter.class)
    @Column(name = "meal_time", nullable = false)
    private MealTimeType mealTime;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
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
    
    @Column(name = "calories")
    private BigDecimal calories;
    
    @Column(name = "carbs")
    private BigDecimal carbs;
    
    @Column(name = "protein")
    private BigDecimal protein;
    
    @Column(name = "fat")
    private BigDecimal fat;
} 