package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.HealthRecord;
import com.lifebit.coreapi.repository.HealthRecordRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class HealthRecordService {

    private final HealthRecordRepository healthRecordRepository;

    /**
     * 사용자의 모든 건강 기록 조회 (최신순)
     */
    public List<HealthRecord> getAllHealthRecords(Long userId) {
        return healthRecordRepository.findByUserIdOrderByRecordDateDesc(userId);
    }

    /**
     * 사용자의 최근 N일간 건강 기록 조회
     */
    public List<HealthRecord> getRecentHealthRecords(Long userId, int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        return healthRecordRepository.findRecentHealthRecords(userId, startDate);
    }

    /**
     * 사용자의 특정 기간 건강 기록 조회
     */
    public List<HealthRecord> getHealthRecordsByPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        return healthRecordRepository.findByUserIdAndRecordDateBetweenOrderByRecordDateDesc(userId, startDate, endDate);
    }

    /**
     * 사용자의 최신 건강 기록 조회
     */
    public Optional<HealthRecord> getLatestHealthRecord(Long userId) {
        return healthRecordRepository.findFirstByUserIdOrderByRecordDateDesc(userId);
    }

    /**
     * 특정 날짜의 건강 기록 조회
     */
    public Optional<HealthRecord> getHealthRecordByDate(Long userId, LocalDate date) {
        return healthRecordRepository.findByUserIdAndRecordDate(userId, date);
    }

    /**
     * 건강 기록 생성
     */
    @Transactional
    public HealthRecord createHealthRecord(HealthRecord healthRecord) {
        log.info("건강 기록 생성 - 사용자: {}, 체중: {}kg, 날짜: {}", 
            healthRecord.getUserId(), healthRecord.getWeight(), healthRecord.getRecordDate());
        return healthRecordRepository.save(healthRecord);
    }

    /**
     * 건강 기록 업데이트
     */
    @Transactional
    public HealthRecord updateHealthRecord(Long recordId, HealthRecord updatedRecord) {
        HealthRecord existingRecord = healthRecordRepository.findById(recordId)
            .orElseThrow(() -> new RuntimeException("건강 기록을 찾을 수 없습니다: " + recordId));

        // 업데이트 가능한 필드들만 수정
        if (updatedRecord.getWeight() != null) {
            existingRecord.setWeight(updatedRecord.getWeight());
        }
        if (updatedRecord.getHeight() != null) {
            existingRecord.setHeight(updatedRecord.getHeight());
        }
        if (updatedRecord.getRecordDate() != null) {
            existingRecord.setRecordDate(updatedRecord.getRecordDate());
        }

        log.info("건강 기록 업데이트 - ID: {}, 사용자: {}", recordId, existingRecord.getUserId());
        return healthRecordRepository.save(existingRecord);
    }

    /**
     * 건강 기록 삭제
     */
    @Transactional
    public void deleteHealthRecord(Long recordId) {
        if (!healthRecordRepository.existsById(recordId)) {
            throw new RuntimeException("건강 기록을 찾을 수 없습니다: " + recordId);
        }
        
        log.info("건강 기록 삭제 - ID: {}", recordId);
        healthRecordRepository.deleteById(recordId);
    }

    /**
     * 사용자의 건강 기록 개수 조회
     */
    public long getHealthRecordCount(Long userId) {
        return healthRecordRepository.countByUserId(userId);
    }
} 