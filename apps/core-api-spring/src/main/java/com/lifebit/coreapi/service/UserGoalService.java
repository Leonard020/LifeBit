package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.repository.UserGoalRepository;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserGoalService {
    private final UserGoalRepository userGoalRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserGoal getUserGoal(Long userId) {
        return userGoalRepository.findByUserId(userId).orElse(null);
    }

    @Transactional
    public UserGoal getOrCreateUserGoal(Long userId) {
        // 먼저 조회 시도
        UserGoal existingGoal = userGoalRepository.findByUserId(userId).orElse(null);
        
        if (existingGoal != null) {
            return existingGoal;
        }
        
        // 없으면 새로 생성
        return createDefaultUserGoal(userId);
    }

    @Transactional
    public UserGoal updateUserGoal(Long userId, UserGoal request) {
        UserGoal existingGoal = getOrCreateUserGoal(userId);

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

    @Transactional
    private UserGoal createDefaultUserGoal(Long userId) {
        UserGoal defaultGoal = new UserGoal();
        defaultGoal.setUuid(UUID.randomUUID());
        defaultGoal.setUserId(userId);
        defaultGoal.setWeeklyWorkoutTarget(null);
        defaultGoal.setDailyCarbsTarget(null);
        defaultGoal.setDailyProteinTarget(null);
        defaultGoal.setDailyFatTarget(null);
        defaultGoal.setDailyCaloriesTarget(null);
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        return userGoalRepository.save(defaultGoal);
    }
    
    /**
     * 읽기 전용으로 목표 조회, 없으면 기본값 반환 (DB 저장하지 않음)
     */
    @Transactional(readOnly = true)
    public UserGoal getUserGoalOrDefault(Long userId) {
        UserGoal existingGoal = userGoalRepository.findByUserId(userId).orElse(null);
        
        if (existingGoal != null) {
            return existingGoal;
        }
        
        // DB에 저장하지 않고 메모리상의 기본값만 반환
        UserGoal defaultGoal = new UserGoal();
        defaultGoal.setUserId(userId);
        defaultGoal.setWeeklyWorkoutTarget(null);
        defaultGoal.setDailyCarbsTarget(null);
        defaultGoal.setDailyProteinTarget(null);
        defaultGoal.setDailyFatTarget(null);
        defaultGoal.setDailyCaloriesTarget(null);
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        
        return defaultGoal;
    }

    /**
     * 사용자 목표 생성
     */
    @Transactional
    public UserGoal createUserGoal(UserGoal userGoal) {
        // UUID 설정
        userGoal.setUuid(UUID.randomUUID());
        
        // 생성/수정 시간 설정
        LocalDateTime now = LocalDateTime.now();
        userGoal.setCreatedAt(now);
        userGoal.setUpdatedAt(now);
        
        return userGoalRepository.save(userGoal);
    }

    /**
     * ID로 사용자 목표 조회
     */
    @Transactional(readOnly = true)
    public UserGoal getUserGoalById(Long goalId) {
        return userGoalRepository.findById(goalId).orElse(null);
    }

    /**
     * 사용자 목표 삭제
     */
    @Transactional
    public void deleteUserGoal(Long goalId) {
        if (!userGoalRepository.existsById(goalId)) {
            throw new RuntimeException("사용자 목표를 찾을 수 없습니다: " + goalId);
        }
        userGoalRepository.deleteById(goalId);
    }

    /**
     * 성별에 따라 식단 목표치 디폴트값을 반환
     */
    public UserGoal getDefaultDietGoalByGender(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        String gender = user.getGender();

        UserGoal defaultGoal = new UserGoal();
        defaultGoal.setUuid(UUID.randomUUID());
        defaultGoal.setUserId(userId);
        // 운동 목표치는 null 또는 필요시 설정
        defaultGoal.setWeeklyWorkoutTarget(null);
        // 식단 목표치는 성별에 따라 다르게 설정
        if ("MALE".equalsIgnoreCase(gender)) {
            defaultGoal.setDailyCarbsTarget(359);
            defaultGoal.setDailyProteinTarget(78);
            defaultGoal.setDailyFatTarget(51);
            defaultGoal.setDailyCaloriesTarget(2300);
        } else if ("FEMALE".equalsIgnoreCase(gender)) {
            defaultGoal.setDailyCarbsTarget(289);
            defaultGoal.setDailyProteinTarget(62);
            defaultGoal.setDailyFatTarget(41);
            defaultGoal.setDailyCaloriesTarget(1900);
        } else {
            defaultGoal.setDailyCarbsTarget(310);
            defaultGoal.setDailyProteinTarget(150);
            defaultGoal.setDailyFatTarget(45);
            defaultGoal.setDailyCaloriesTarget(2100);
        }
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        return defaultGoal;
    }
} 