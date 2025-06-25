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
import java.util.Objects;
import com.lifebit.coreapi.service.notification.HealthNotificationService;

@Service
@RequiredArgsConstructor
public class UserGoalService {
    private final UserGoalRepository userGoalRepository;
    private final UserRepository userRepository;
    private final HealthNotificationService healthNotificationService;

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

    /**
     * Calculate total weekly workout target as sum of all exercise goals
     */
    private Integer calculateTotalWeeklyWorkoutTarget(UserGoal goal) {
        int total = 0;
        if (goal.getWeeklyChest() != null) total += goal.getWeeklyChest();
        if (goal.getWeeklyBack() != null) total += goal.getWeeklyBack();
        if (goal.getWeeklyLegs() != null) total += goal.getWeeklyLegs();
        if (goal.getWeeklyShoulders() != null) total += goal.getWeeklyShoulders();
        if (goal.getWeeklyArms() != null) total += goal.getWeeklyArms();
        if (goal.getWeeklyAbs() != null) total += goal.getWeeklyAbs();
        if (goal.getWeeklyCardio() != null) total += goal.getWeeklyCardio();
        return total;
    }

    @Transactional
    public UserGoal updateUserGoal(Long userId, UserGoal request) {
        UserGoal existingGoal = getOrCreateUserGoal(userId);

        // Update individual exercise goals first
        if (request.getWeeklyChest() != null) existingGoal.setWeeklyChest(request.getWeeklyChest());
        if (request.getWeeklyBack() != null) existingGoal.setWeeklyBack(request.getWeeklyBack());
        if (request.getWeeklyLegs() != null) existingGoal.setWeeklyLegs(request.getWeeklyLegs());
        if (request.getWeeklyShoulders() != null) existingGoal.setWeeklyShoulders(request.getWeeklyShoulders());
        if (request.getWeeklyArms() != null) existingGoal.setWeeklyArms(request.getWeeklyArms());
        if (request.getWeeklyAbs() != null) existingGoal.setWeeklyAbs(request.getWeeklyAbs());
        if (request.getWeeklyCardio() != null) existingGoal.setWeeklyCardio(request.getWeeklyCardio());

        // Automatically calculate and set the total weekly workout target
        Integer totalWorkoutTarget = calculateTotalWeeklyWorkoutTarget(existingGoal);
        existingGoal.setWeeklyWorkoutTarget(totalWorkoutTarget);

        // Update diet goals
        if (request.getDailyCarbsTarget() != null) {
            existingGoal.setDailyCarbsTarget(request.getDailyCarbsTarget());
        }
        if (request.getDailyProteinTarget() != null) {
            existingGoal.setDailyProteinTarget(request.getDailyProteinTarget());
        }
        if (request.getDailyFatTarget() != null) {
            existingGoal.setDailyFatTarget(request.getDailyFatTarget());
        }
        if (request.getDailyCaloriesTarget() != null) {
            existingGoal.setDailyCaloriesTarget(request.getDailyCaloriesTarget());
        }

        existingGoal.setUpdatedAt(LocalDateTime.now());
        UserGoal savedGoal = userGoalRepository.save(existingGoal);

        // 목표 수정 알림
        healthNotificationService.sendGoalAchievementNotification(userId, "목표 수정", "목표가 수정되었습니다.");

        // 목표 달성 임박 체크 (예: 주간 운동 목표 90% 이상)
        if (savedGoal.getWeeklyWorkoutTarget() != null) {
            int progress = getCurrentWeeklyWorkoutProgress(userId); // 실제 구현 필요
            if (progress >= (int)(savedGoal.getWeeklyWorkoutTarget() * 0.9)) {
                healthNotificationService.sendGoalAchievementNotification(userId, "목표 임박", "주간 운동 목표 달성이 임박했습니다! (" + progress + "/" + savedGoal.getWeeklyWorkoutTarget() + ")");
            }
        }
        return savedGoal;
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
        defaultGoal.setWeeklyChest(null);
        defaultGoal.setWeeklyBack(null);
        defaultGoal.setWeeklyLegs(null);
        defaultGoal.setWeeklyShoulders(null);
        defaultGoal.setWeeklyArms(null);
        defaultGoal.setWeeklyAbs(null);
        defaultGoal.setWeeklyCardio(null);
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
        defaultGoal.setWeeklyChest(null);
        defaultGoal.setWeeklyBack(null);
        defaultGoal.setWeeklyLegs(null);
        defaultGoal.setWeeklyShoulders(null);
        defaultGoal.setWeeklyArms(null);
        defaultGoal.setWeeklyAbs(null);
        defaultGoal.setWeeklyCardio(null);
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
        
        // Automatically calculate and set the total weekly workout target
        Integer totalWorkoutTarget = calculateTotalWeeklyWorkoutTarget(userGoal);
        userGoal.setWeeklyWorkoutTarget(totalWorkoutTarget);
        
        // 생성/수정 시간 설정
        LocalDateTime now = LocalDateTime.now();
        userGoal.setCreatedAt(now);
        userGoal.setUpdatedAt(now);
        
        UserGoal savedGoal = userGoalRepository.save(userGoal);
        // 목표 설정 알림
        healthNotificationService.sendGoalAchievementNotification(userGoal.getUserId(), "목표 설정", "목표가 성공적으로 설정되었습니다.");
        return savedGoal;
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
        defaultGoal.setWeeklyChest(null);
        defaultGoal.setWeeklyBack(null);
        defaultGoal.setWeeklyLegs(null);
        defaultGoal.setWeeklyShoulders(null);
        defaultGoal.setWeeklyArms(null);
        defaultGoal.setWeeklyAbs(null);
        defaultGoal.setWeeklyCardio(null);
        defaultGoal.setCreatedAt(LocalDateTime.now());
        defaultGoal.setUpdatedAt(LocalDateTime.now());
        return defaultGoal;
    }

    @Transactional(readOnly = true)
    public UserGoal getLatestUserGoal(Long userId) {
        return userGoalRepository.findTopByUserIdOrderByCreatedAtDesc(userId).orElse(null);
    }

    public boolean isSameGoal(UserGoal a, UserGoal b) {
        if (a == null || b == null) return false;
        return
            Objects.equals(a.getWeeklyWorkoutTarget(), b.getWeeklyWorkoutTarget()) &&
            Objects.equals(a.getDailyCarbsTarget(), b.getDailyCarbsTarget()) &&
            Objects.equals(a.getDailyProteinTarget(), b.getDailyProteinTarget()) &&
            Objects.equals(a.getDailyFatTarget(), b.getDailyFatTarget()) &&
            Objects.equals(a.getDailyCaloriesTarget(), b.getDailyCaloriesTarget()) &&
            Objects.equals(a.getWeeklyChest(), b.getWeeklyChest()) &&
            Objects.equals(a.getWeeklyBack(), b.getWeeklyBack()) &&
            Objects.equals(a.getWeeklyLegs(), b.getWeeklyLegs()) &&
            Objects.equals(a.getWeeklyShoulders(), b.getWeeklyShoulders()) &&
            Objects.equals(a.getWeeklyArms(), b.getWeeklyArms()) &&
            Objects.equals(a.getWeeklyAbs(), b.getWeeklyAbs()) &&
            Objects.equals(a.getWeeklyCardio(), b.getWeeklyCardio());
    }

    // 목표 임박 체크용 예시 메서드
    private int getCurrentWeeklyWorkoutProgress(Long userId) {
        // 실제 운동 기록에서 주간 운동 횟수/시간을 조회하는 로직 필요
        // 예시: ExerciseService 등에서 가져오기
        // 여기서는 0 반환 (구현 필요)
        return 0;
    }
} 