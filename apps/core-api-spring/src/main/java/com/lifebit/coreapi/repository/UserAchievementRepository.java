package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.UserAchievement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAchievementRepository extends JpaRepository<UserAchievement, Long> {
    
    // 특정 사용자의 모든 업적 조회 (Achievement 정보 포함)
    @Query("SELECT ua FROM UserAchievement ua " +
           "JOIN FETCH ua.achievement a " +
           "WHERE ua.user.userId = :userId AND a.isActive = true " +
           "ORDER BY ua.isAchieved DESC, a.badgeType ASC")
    List<UserAchievement> findByUserIdWithAchievements(@Param("userId") Long userId);
    
    // 특정 사용자의 달성한 업적들만 조회
    @Query("SELECT ua FROM UserAchievement ua " +
           "JOIN FETCH ua.achievement a " +
           "WHERE ua.user.userId = :userId AND ua.isAchieved = true AND a.isActive = true " +
           "ORDER BY ua.achievedDate DESC")
    List<UserAchievement> findAchievedByUserId(@Param("userId") Long userId);
    
    // 특정 사용자의 특정 업적 조회
    @Query("SELECT ua FROM UserAchievement ua " +
           "WHERE ua.user.userId = :userId AND ua.achievement.achievementId = :achievementId")
    Optional<UserAchievement> findByUserIdAndAchievementId(@Param("userId") Long userId, 
                                                          @Param("achievementId") Long achievementId);
    
    // 특정 사용자의 달성률 계산
    @Query("SELECT COUNT(ua) FROM UserAchievement ua " +
           "JOIN ua.achievement a " +
           "WHERE ua.user.userId = :userId AND ua.isAchieved = true AND a.isActive = true")
    Long countAchievedByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(ua) FROM UserAchievement ua " +
           "JOIN ua.achievement a " +
           "WHERE ua.user.userId = :userId AND a.isActive = true")
    Long countTotalByUserId(@Param("userId") Long userId);
} 