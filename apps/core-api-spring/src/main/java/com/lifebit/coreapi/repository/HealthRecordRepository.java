package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface HealthRecordRepository extends JpaRepository<HealthRecord, Long> {
    
    // 사용자별 건강 기록 조회 (최신순)
    List<HealthRecord> findByUserIdOrderByRecordDateDesc(Long userId);
    
    // 사용자별 특정 기간 건강 기록 조회
    List<HealthRecord> findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(
        Long userId, LocalDate startDate, LocalDate endDate);
    
    // 사용자의 최신 건강 기록 조회
    Optional<HealthRecord> findFirstByUserIdOrderByRecordDateDesc(Long userId);
    
    // 사용자별 최근 N일간 건강 기록 조회
    @Query("SELECT hr FROM HealthRecord hr WHERE hr.userId = :userId AND hr.recordDate >= :startDate ORDER BY hr.recordDate DESC")
    List<HealthRecord> findRecentHealthRecords(@Param("userId") Long userId, @Param("startDate") LocalDate startDate);
    
    // 특정 날짜의 건강 기록 조회
    Optional<HealthRecord> findByUserIdAndRecordDate(Long userId, LocalDate recordDate);
    
    // 사용자별 건강 기록 개수
    long countByUserId(Long userId);
} 