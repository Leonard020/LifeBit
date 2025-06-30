package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "food_items", indexes = {
    @Index(name = "idx_food_code", columnList = "foodCode"),
    @Index(name = "idx_created_at", columnList = "createdAt")
})
@Getter @Setter
public class FoodItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "food_item_id")
    private Long foodItemId;
    
    @Column(unique = true, nullable = false)
    private UUID uuid;
    
    @Column(unique = true, length = 50)
    private String foodCode;
    
    @Column(nullable = false, length = 255)
    private String name;
    
    @Column(precision = 6, scale = 2)
    private BigDecimal servingSize;
    @Column(precision = 6, scale = 2)
    private BigDecimal calories;
    @Column(precision = 6, scale = 2)
    private BigDecimal carbs;
    @Column(precision = 6, scale = 2)
    private BigDecimal protein;
    @Column(precision = 6, scale = 2)
    private BigDecimal fat;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
} 