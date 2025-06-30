package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;


public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);
    
    // 대시보드 통계용 메서드
    long countByLastVisitedAfter(LocalDateTime dateTime);
    long countByCreatedAtAfter(LocalDateTime dateTime);

    // 커스텀 저장 메서드 제거 - 표준 JPA save() 사용
} 