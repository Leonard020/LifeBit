package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exercise_catalog")
@Getter @Setter

public class ExerciseCatalog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long exerciseCatalogId;
    
    private UUID uuid;
    
    @Column(nullable = false, unique = true)
    private String name;
    
    @Convert(converter = BodyPartTypeConverter.class)
    @Column(name = "body_part", nullable = false)
    private BodyPartType bodyPart;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String intensity;
    
    @JsonProperty("exerciseType")
    private String exerciseType;
    
    private LocalDateTime createdAt;
    
    // exerciseType을 위한 getter 메서드 (JSON 직렬화용)
    public String getExerciseType() {
        return exerciseType != null ? exerciseType : "미지정";
    }
    
    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (uuid == null) {
            uuid = UUID.randomUUID();
        }
    }
} 