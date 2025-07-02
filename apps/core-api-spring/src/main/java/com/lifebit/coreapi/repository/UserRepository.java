package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    
    // 대시보드 통계용 메서드
    long countByLastVisitedAfter(LocalDateTime dateTime);
    long countByCreatedAtAfter(LocalDateTime dateTime);
    
    // 애널리틱스용 추가 메서드들
    @Query("SELECT COUNT(u) FROM User u WHERE u.lastVisited BETWEEN :start AND :end")
    Long countByLastVisitedBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt BETWEEN :start AND :end")
    Long countByCreatedAtBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
    
    // ✨ 활동 사용자 합집합 (운동 OR 식사 기록을 남긴 고유 사용자 수)
    @Query(value = """
        SELECT COUNT(DISTINCT user_id) FROM (
            SELECT DISTINCT user_id FROM exercise_sessions 
            WHERE created_at BETWEEN :start AND :end
            UNION
            SELECT DISTINCT user_id FROM meal_logs 
            WHERE created_at BETWEEN :start AND :end
        ) AS active_users
        """, nativeQuery = true)
    Long countDistinctActiveUsersInPeriod(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 커스텀 저장 메서드 제거 - 표준 JPA save() 사용
} 