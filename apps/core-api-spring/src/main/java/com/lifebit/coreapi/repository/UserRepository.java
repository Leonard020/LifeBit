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
    
    // 애널리틱스용 추가 메서드들 (임시 주석처리)
    // @Query("SELECT COUNT(u) FROM User u WHERE u.lastVisited BETWEEN :start AND :end")
    // Long countUsersLoginBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    // 커스텀 저장 메서드 제거 - 표준 JPA save() 사용
} 