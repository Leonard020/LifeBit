package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.UserGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserGoalRepository extends JpaRepository<UserGoal, Long> {
    Optional<UserGoal> findByUserId(Long userId);
    Optional<UserGoal> findTopByUserIdOrderByCreatedAtDesc(Long userId);
} 