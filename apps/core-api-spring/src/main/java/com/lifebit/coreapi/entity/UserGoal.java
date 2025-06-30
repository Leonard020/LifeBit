package com.lifebit.coreapi.entity;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_goals",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"uuid"})
    },
    indexes = {
        @Index(name = "idx_user_goals_user_id", columnList = "user_id")
    }
)
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
    @JsonProperty("weekly_workout_target")
    private Integer weeklyWorkoutTarget;
    
    @Column(name = "weekly_workout_target_set")
    @JsonProperty("weekly_workout_target_set")
    private Integer weeklyWorkoutTargetSet;
    
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
    
    @Column(name = "weekly_chest")
    @JsonProperty("weekly_chest")
    private Integer weeklyChest;
    
    @Column(name = "weekly_back")
    @JsonProperty("weekly_back")
    private Integer weeklyBack;
    
    @Column(name = "weekly_legs")
    @JsonProperty("weekly_legs")
    private Integer weeklyLegs;
    
    @Column(name = "weekly_shoulders")
    @JsonProperty("weekly_shoulders")
    private Integer weeklyShoulders;
    
    @Column(name = "weekly_arms")
    @JsonProperty("weekly_arms")
    private Integer weeklyArms;
    
    @Column(name = "weekly_abs")
    @JsonProperty("weekly_abs")
    private Integer weeklyAbs;
    
    @Column(name = "weekly_cardio")
    @JsonProperty("weekly_cardio")
    private Integer weeklyCardio;
    
    @Column(name = "weekly_chest_set")
    @JsonProperty("weekly_chest_set")
    private Integer weeklyChestSet;
    
    @Column(name = "weekly_back_set")
    @JsonProperty("weekly_back_set")
    private Integer weeklyBackSet;
    
    @Column(name = "weekly_legs_set")
    @JsonProperty("weekly_legs_set")
    private Integer weeklyLegsSet;
    
    @Column(name = "weekly_shoulders_set")
    @JsonProperty("weekly_shoulders_set")
    private Integer weeklyShouldersSet;
    
    @Column(name = "weekly_arms_set")
    @JsonProperty("weekly_arms_set")
    private Integer weeklyArmsSet;
    
    @Column(name = "weekly_abs_set")
    @JsonProperty("weekly_abs_set")
    private Integer weeklyAbsSet;
    
    @Column(name = "weekly_cardio_set")
    @JsonProperty("weekly_cardio_set")
    private Integer weeklyCardioSet;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
} 