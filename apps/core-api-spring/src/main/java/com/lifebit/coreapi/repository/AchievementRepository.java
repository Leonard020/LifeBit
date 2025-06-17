package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AchievementRepository extends JpaRepository<Achievement, Long> {
    
    // 활성화된 업적들만 조회
    List<Achievement> findByIsActiveTrue();
    
    // 제목으로 업적 조회
    Achievement findByTitle(String title);
    
    // 뱃지 타입별 업적 조회
    @Query("SELECT a FROM Achievement a WHERE a.badgeType = :badgeType AND a.isActive = true")
    List<Achievement> findByBadgeTypeAndIsActiveTrue(String badgeType);
} 