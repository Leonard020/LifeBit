package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.repository.UserGoalRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class UserGoalService {
    private final UserGoalRepository userGoalRepository;

    public UserGoal getUserGoal(Long userId) {
        return userGoalRepository.findByUserId(userId)
                .orElse(createDefaultUserGoal(userId));
    }

    @Transactional
    public UserGoal updateUserGoal(Long userId, UserGoal request) {
        UserGoal existingGoal = userGoalRepository.findByUserId(userId)
                .orElse(createDefaultUserGoal(userId));

        // 목표 값 업데이트
        if (request.getWeeklyWorkoutTarget() != null) {
            existingGoal.setWeeklyWorkoutTarget(request.getWeeklyWorkoutTarget());
        }
        if (request.getDailyCarbsTarget() != null) {
            existingGoal.setDailyCarbsTarget(request.getDailyCarbsTarget());
        }
        if (request.getDailyProteinTarget() != null) {
            existingGoal.setDailyProteinTarget(request.getDailyProteinTarget());
        }
        if (request.getDailyFatTarget() != null) {
            existingGoal.setDailyFatTarget(request.getDailyFatTarget());
        }

        existingGoal.setUpdatedAt(LocalDateTime.now());
        return userGoalRepository.save(existingGoal);
    }

    private UserGoal createDefaultUserGoal(Long userId) {
        UserGoal defaultGoal = new UserGoal();
        defaultGoal.setUuid(UUID.randomUUID());
        defaultGoal.setUserId(userId);
        defaultGoal.setWeeklyWorkoutTarget(3);
        defaultGoal.setDailyCarbsTarget(250);
        defaultGoal.setDailyProteinTarget(150);
        defaultGoal.setDailyFatTarget(67);
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        return userGoalRepository.save(defaultGoal);
    }
} 