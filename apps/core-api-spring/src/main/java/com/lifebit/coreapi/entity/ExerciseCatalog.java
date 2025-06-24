package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
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
    
    @Column(nullable = false)
    private String name;
    
    @Convert(converter = BodyPartTypeConverter.class)
    @Column(name = "body_part", nullable = false)
    private BodyPartType bodyPart;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    private String intensity;
    
    private LocalDateTime createdAt;
} 