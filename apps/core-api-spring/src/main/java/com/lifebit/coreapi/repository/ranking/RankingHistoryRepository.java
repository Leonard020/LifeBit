package com.lifebit.coreapi.repository.ranking;

import com.lifebit.coreapi.entity.RankingHistory;
import com.lifebit.coreapi.entity.enums.PeriodType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RankingHistoryRepository extends JpaRepository<RankingHistory, Long> {
    
    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userUuid = :userUuid ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findByUserUuidOrderByRecordedAtDesc(
        @Param("userUuid") String userUuid, 
        Pageable pageable
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.periodType = :periodType ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findByPeriodTypeOrderByRecordedAtDesc(
        @Param("periodType") PeriodType periodType, 
        Pageable pageable
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.season = :season ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findBySeasonOrderByRecordedAtDesc(
        @Param("season") String season, 
        Pageable pageable
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.recordedAt BETWEEN :startDate AND :endDate ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findByDateRange(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userUuid = :userUuid AND rh.recordedAt BETWEEN :startDate AND :endDate ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findByUserUuidAndDateRange(
        @Param("userUuid") String userUuid,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.periodType = :periodType AND rh.recordedAt BETWEEN :startDate AND :endDate ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findByPeriodTypeAndDateRange(
        @Param("periodType") PeriodType periodType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.season = :season AND rh.recordedAt BETWEEN :startDate AND :endDate ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findBySeasonAndDateRange(
        @Param("season") String season,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userUuid = :userUuid " +
           "AND rh.recordedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findByUserUuidAndRecordedAtBetween(
        @Param("userUuid") String userUuid,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userUuid = :userUuid " +
           "AND rh.periodType = :periodType " +
           "AND rh.recordedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findUserPeriodHistory(
        @Param("userUuid") String userUuid,
        @Param("periodType") PeriodType periodType,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userUuid = :userUuid " +
           "AND rh.season = :season " +
           "AND rh.recordedAt BETWEEN :startDate AND :endDate " +
           "ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findUserSeasonHistory(
        @Param("userUuid") String userUuid,
        @Param("season") String season,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
} 