package com.lifebit.coreapi.repository.ranking;

import com.lifebit.coreapi.entity.RankingHistory;
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
    @Query("SELECT rh FROM RankingHistory rh WHERE rh.userRanking.id = :userRankingId ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findByUserRankingIdOrderByRecordedAtDesc(@Param("userRankingId") Long userRankingId, Pageable pageable);

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.periodType = :periodType ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findByPeriodTypeOrderByRecordedAtDesc(@Param("periodType") String periodType, Pageable pageable);

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.season = :season ORDER BY rh.recordedAt DESC")
    Page<RankingHistory> findBySeasonOrderByRecordedAtDesc(@Param("season") int season, Pageable pageable);

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.recordedAt BETWEEN :startDate AND :endDate ORDER BY rh.recordedAt DESC")
    List<RankingHistory> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    @Query("SELECT rh FROM RankingHistory rh WHERE rh.periodType = :periodType AND rh.season = :season ORDER BY rh.recordedAt DESC")
    java.util.List<RankingHistory> findByPeriodTypeAndSeasonOrderByRecordedAtDesc(@Param("periodType") String periodType, @Param("season") int season);
} 