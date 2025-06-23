package com.lifebit.coreapi.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_goals")
@Getter @Setter
public class UserGoal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_goal_id")
    private Long userGoalId;
    
    private UUID uuid;
    
    @Column(name = "user_id")
    private Long userId;
    
    @Column(name = "weekly_workout_target")
    private Integer weeklyWorkoutTarget;
    
    @Column(name = "daily_carbs_target")
    @JsonProperty("daily_carbs_target")
    private Integer dailyCarbsTarget;
    
    @Column(name = "daily_protein_target")
    @JsonProperty("daily_protein_target")
    private Integer dailyProteinTarget;
    
    @Column(name = "daily_fat_target")
    @JsonProperty("daily_fat_target")
    private Integer dailyFatTarget;
    
    @Column(name = "daily_calory_target")
    @JsonProperty("daily_calories_target")
    private Integer dailyCaloriesTarget;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
} 