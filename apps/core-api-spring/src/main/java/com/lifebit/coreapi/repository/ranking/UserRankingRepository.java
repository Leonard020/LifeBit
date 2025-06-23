package com.lifebit.coreapi.repository.ranking;

import com.lifebit.coreapi.entity.UserRanking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRankingRepository extends JpaRepository<UserRanking, Long> {
    Optional<UserRanking> findByUserId(Long userId);

    @Query("SELECT ur FROM UserRanking ur WHERE ur.isActive = true ORDER BY ur.totalScore DESC")
    Page<UserRanking> findTopRankings(Pageable pageable);

    @Query("SELECT ur FROM UserRanking ur WHERE ur.season = :season AND ur.isActive = true ORDER BY ur.totalScore DESC")
    Page<UserRanking> findAllBySeasonOrderByTotalScoreDesc(@Param("season") int season, Pageable pageable);

    @Query("SELECT ur FROM UserRanking ur WHERE ur.isActive = true ORDER BY ur.streakDays DESC")
    List<UserRanking> findTopRankingsByStreakDays(Pageable pageable);

    @Query("SELECT ur FROM UserRanking ur WHERE ur.season = :season AND ur.isActive = true ORDER BY ur.totalScore DESC")
    List<UserRanking> findTopRankingsBySeason(@Param("season") String season, Pageable pageable);
} 