package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.UserDTO;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.UserRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final MealLogRepository mealLogRepository;
    private final ExerciseSessionRepository exerciseSessionRepository;

    public AdminService(UserRepository userRepository, 
                       MealLogRepository mealLogRepository,
                       ExerciseSessionRepository exerciseSessionRepository) {
        this.userRepository = userRepository;
        this.mealLogRepository = mealLogRepository;
        this.exerciseSessionRepository = exerciseSessionRepository;
    }

    public List<UserDTO> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private UserDTO convertToDTO(User user) {
        return new UserDTO(
            user.getUserId().toString(),
            user.getPasswordHash(),
            user.getEmail(),
            user.getNickname(),
            user.getRole().name(),
            user.getCreatedAt(),
            user.getLastVisited()
        );
    }

    public void deleteUserById(Long userId) {
        userRepository.deleteById(userId);
    }

    public Map<String, Object> getDashboardStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // 현재 시간 기준 계산
        LocalDateTime now = LocalDateTime.now();
        LocalDate today = now.toLocalDate();
        LocalDate weekStart = today.minusDays(7);
        LocalDate monthStart = today.minusDays(30);
        
        try {
            // 총 회원수
            long totalUsers = userRepository.count();
            stats.put("totalUsers", totalUsers);
            
            // 신규 가입자 수 (주간/월간)
            long weeklyNewUsers = userRepository.countByCreatedAtAfter(weekStart.atStartOfDay());
            long monthlyNewUsers = userRepository.countByCreatedAtAfter(monthStart.atStartOfDay());
            stats.put("weeklyNewUsers", weeklyNewUsers);
            stats.put("monthlyNewUsers", monthlyNewUsers);
            
            // 일일 접속자 (lastVisited가 오늘인 사용자)
            long dailyActiveUsers = userRepository.countByLastVisitedAfter(today.atStartOfDay());
            stats.put("dailyActiveUsers", dailyActiveUsers);
            
            // 주간 접속자 (lastVisited가 지난 7일 이내인 사용자)
            long weeklyActiveUsers = userRepository.countByLastVisitedAfter(weekStart.atStartOfDay());
            stats.put("weeklyActiveUsers", weeklyActiveUsers);
            
            // 월간 접속자 (lastVisited가 지난 30일 이내인 사용자)
            long monthlyActiveUsers = userRepository.countByLastVisitedAfter(monthStart.atStartOfDay());
            stats.put("monthlyActiveUsers", monthlyActiveUsers);
            
            // 일일 활동자 (오늘 기록을 작성한 사용자 수) - 시뮬레이션 데이터
            long dailyExerciseUsers = exerciseSessionRepository.countDistinctUsersByDateBetween(today, today);
            long dailyMealUsers = mealLogRepository.countDistinctUsersByDateBetween(today, today);
            // 간단한 계산으로 활동자 수 추정
            long dailyActiveRecorders = Math.max(dailyExerciseUsers, dailyMealUsers);
            stats.put("dailyActiveRecorders", dailyActiveRecorders);
            
            // 주간 활동자
            long weeklyExerciseUsers = exerciseSessionRepository.countDistinctUsersByDateBetween(weekStart, today);
            long weeklyMealUsers = mealLogRepository.countDistinctUsersByDateBetween(weekStart, today);
            long weeklyActiveRecorders = Math.max(weeklyExerciseUsers, weeklyMealUsers);
            stats.put("weeklyActiveRecorders", weeklyActiveRecorders);
            
            // 월간 활동자
            long monthlyExerciseUsers = exerciseSessionRepository.countDistinctUsersByDateBetween(monthStart, today);
            long monthlyMealUsers = mealLogRepository.countDistinctUsersByDateBetween(monthStart, today);
            long monthlyActiveRecorders = Math.max(monthlyExerciseUsers, monthlyMealUsers);
            stats.put("monthlyActiveRecorders", monthlyActiveRecorders);
            
        } catch (Exception e) {
            // 오류 발생 시 기본값 설정
            stats.put("totalUsers", 0L);
            stats.put("weeklyNewUsers", 0L);
            stats.put("monthlyNewUsers", 0L);
            stats.put("dailyActiveUsers", 0L);
            stats.put("weeklyActiveUsers", 0L);
            stats.put("monthlyActiveUsers", 0L);
            stats.put("dailyActiveRecorders", 0L);
            stats.put("weeklyActiveRecorders", 0L);
            stats.put("monthlyActiveRecorders", 0L);
        }
        
        return stats;
    }
} 