package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "workouts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Workout {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    private LocalDate date;

    private String exerciseName; // 운동명

    private String part; // 부위 (ex: 가슴, 하체, 등)

    private int sets;

    private int reps;

    private int weight;
}
