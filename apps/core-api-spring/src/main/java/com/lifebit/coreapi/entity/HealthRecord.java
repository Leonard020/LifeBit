package com.lifebit.coreapi.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "health_records")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "health_record_id")
    private Long healthRecordId;

    @Column(unique = true, nullable = false)
    private UUID uuid;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    @Column(precision = 5, scale = 2)
    private BigDecimal height;

    @Column(precision = 4, scale = 2)
    private BigDecimal bmi;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.uuid = UUID.randomUUID();
        this.createdAt = LocalDateTime.now();
        
        // BMI 자동 계산
        if (this.weight != null && this.height != null && this.height.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightInMeters = this.height.divide(BigDecimal.valueOf(100));
            this.bmi = this.weight.divide(heightInMeters.multiply(heightInMeters), 2, BigDecimal.ROUND_HALF_UP);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        // BMI 재계산
        if (this.weight != null && this.height != null && this.height.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal heightInMeters = this.height.divide(BigDecimal.valueOf(100));
            this.bmi = this.weight.divide(heightInMeters.multiply(heightInMeters), 2, BigDecimal.ROUND_HALF_UP);
        }
    }
} 