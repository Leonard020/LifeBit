package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "food_items")
@Getter @Setter
public class FoodItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long foodItemId;
    
    private UUID uuid;
    
    @Column(unique = true)
    private String foodCode;
    
    @Column(nullable = false)
    private String name;
    
    private BigDecimal servingSize;
    private BigDecimal calories;
    private BigDecimal carbs;
    private BigDecimal protein;
    private BigDecimal fat;
    
    private LocalDateTime createdAt;
} 