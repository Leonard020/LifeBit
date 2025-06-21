package com.lifebit.coreapi.repository.ranking;

import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRankingRepository extends JpaRepository<UserRanking, Long> {
    Optional<UserRanking> findByUserUuid(String userUuid);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.isActive = true ORDER BY ur.totalScore DESC")
    Page<UserRanking> findTopRankings(Pageable pageable);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.season = :season AND ur.isActive = true ORDER BY ur.seasonPoints DESC")
    Page<UserRanking> findAllBySeasonOrderBySeasonPointsDesc(@Param("season") String season, Pageable pageable);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.periodType = :periodType AND ur.isActive = true ORDER BY ur.totalScore DESC")
    Page<UserRanking> findAllByPeriodTypeOrderByTotalScoreDesc(@Param("periodType") PeriodType periodType, Pageable pageable);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.season = :season AND ur.isActive = true ORDER BY ur.seasonPoints DESC")
    List<UserRanking> findTopRankingsBySeason(@Param("season") String season, Pageable pageable);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.periodType = :periodType AND ur.isActive = true ORDER BY ur.totalScore DESC")
    List<UserRanking> findTopRankingsByPeriodType(@Param("periodType") PeriodType periodType, Pageable pageable);
    
    @Query("SELECT ur FROM UserRanking ur WHERE ur.isActive = true ORDER BY ur.streakDays DESC LIMIT :limit")
    List<UserRanking> findTopRankingsByStreakDays(@Param("limit") int limit);
    
    @Query("SELECT COUNT(ur) FROM UserRanking ur WHERE ur.periodType = :periodType AND ur.isActive = true")
    Long countActiveRankingsByPeriodType(@Param("periodType") PeriodType periodType);
    
    @Modifying
    @Query("UPDATE UserRanking ur SET ur.periodRank = 0, ur.periodPoints = 0 WHERE ur.periodType = :periodType")
    void resetPeriodRanking(@Param("periodType") PeriodType periodType);
    
    @Modifying
    @Query("UPDATE UserRanking ur SET ur.seasonRank = 0, ur.seasonPoints = 0 WHERE ur.season = :season")
    void resetSeasonRanking(@Param("season") String season);
} 