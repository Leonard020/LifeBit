package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.AchievementService;
import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.service.HealthStatisticsService;
import com.lifebit.coreapi.service.ranking.RankingService;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.security.JwtTokenProvider;
import com.lifebit.coreapi.dto.ranking.RankingUserDto;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/health-statistics")
@RequiredArgsConstructor
@Slf4j
public class HealthStatisticsController {

    private final AchievementService achievementService;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;
    private final HealthStatisticsService healthStatisticsService; // 통합된 서비스 사용
    private final RankingService rankingService;
    private final UserRankingRepository userRankingRepository;

    /**
     * JWT 토큰에서 사용자 ID 추출
     */
    private Long getUserIdFromToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
            String token = bearerToken.substring(7);
            return jwtTokenProvider.getUserIdFromToken(token);
        }
        throw new RuntimeException("JWT token not found");
    }

    /**
     * 통합된 건강 통계 조회
     * 
     * 2024-12-31: HealthStatisticsService로 리팩토링됨
     * - 중복 로직 제거
     * - 서비스 계층 분리
     * - 일관된 에러 처리
     */
    @GetMapping("/{userId}")
    public ResponseEntity<Map<String, Object>> getHealthStatistics(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 통합된 서비스에서 건강 통계 조회
            Map<String, Object> statistics = healthStatisticsService.getHealthStatistics(tokenUserId, period);
            
            // 🍽️ period가 'day'인 경우 실제 영양소 통계 추가
            if ("day".equals(period)) {
                Map<String, Object> nutritionStats = healthStatisticsService.getRealMealNutritionStatistics(tokenUserId, period);
                statistics.putAll(nutritionStats);
                log.info("영양소 통계 추가 완료 - 사용자: {}, 칼로리: {}, 데이터 출처: {}", 
                        tokenUserId, nutritionStats.get("dailyCalories"), nutritionStats.get("dataSource"));
            }
            
            log.info("건강 통계 조회 완료 - 사용자: {}, 기간: {}", tokenUserId, period);
            
            return ResponseEntity.ok(statistics);
            
        } catch (RuntimeException e) {
            log.error("건강 통계 조회 중 비즈니스 로직 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage());
            
            // 구체적인 오류 메시지와 함께 안전한 기본값 반환
            Map<String, Object> fallbackStatistics = createFallbackStatistics(userId);
            
            if (e.getMessage().contains("JWT")) {
                fallbackStatistics.put("error", "인증이 필요합니다. 다시 로그인해주세요.");
                fallbackStatistics.put("errorCode", "AUTH_REQUIRED");
            } else if (e.getMessage().contains("User")) {
                fallbackStatistics.put("error", "사용자 정보를 찾을 수 없습니다.");
                fallbackStatistics.put("errorCode", "USER_NOT_FOUND");
            } else {
                fallbackStatistics.put("error", "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                fallbackStatistics.put("errorCode", "TEMPORARY_ERROR");
            }
            
            return ResponseEntity.ok(fallbackStatistics);
            
        } catch (Exception e) {
            log.error("건강 통계 조회 중 예상치 못한 오류 발생 - 사용자: {}", userId, e);
            
            // 예상치 못한 오류에 대한 안전한 응답
            Map<String, Object> fallbackStatistics = createFallbackStatistics(userId);
            fallbackStatistics.put("error", "서버 오류가 발생했습니다. 관리자에게 문의해주세요.");
            fallbackStatistics.put("errorCode", "SERVER_ERROR");
            
            return ResponseEntity.ok(fallbackStatistics);
        }
    }

    /**
     * 오류 발생 시 안전한 기본값 생성
     */
    private Map<String, Object> createFallbackStatistics(Long userId) {
        Map<String, Object> fallback = new HashMap<>();
        
        fallback.put("userId", userId);
        fallback.put("currentWeight", 70.0);
        fallback.put("weightChange", 0.0);
        fallback.put("currentBMI", 24.0);
        fallback.put("bmiChange", 0.0);
        fallback.put("weeklyWorkouts", 0);
        fallback.put("workoutGoal", 3);
        fallback.put("goalAchievementRate", 0);
        fallback.put("goalChange", 0);
        fallback.put("totalCaloriesBurned", 0);
        fallback.put("averageDailyCalories", 0);
        fallback.put("streak", 0);
        fallback.put("totalWorkoutDays", 0);
        
        return fallback;
    }

    @GetMapping("/ranking")
    public ResponseEntity<Map<String, Object>> getRanking(HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출 (선택적)
            Long currentUserId = null;
            try {
                currentUserId = getUserIdFromToken(request);
                log.debug("User ID from token: {}", currentUserId);
            } catch (Exception e) {
                log.debug("No valid token found, using default user ID");
                currentUserId = 1L; // 기본값
            }
            
            // 사용자 업적 초기화 (필요한 경우)
            achievementService.initializeUserAchievements(currentUserId);
            
            // 실제 데이터베이스에서 상위 랭킹 조회 (기본값 제공)
            List<Map<String, Object>> topRankers;
            Map<String, Object> myRanking;
            
            try {
                // 상위 5명 랭킹 조회
                Pageable topRankingsPageable = PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, "totalScore"));
                Page<UserRanking> topRankingsPage = userRankingRepository.findTopRankings(topRankingsPageable);
                
                topRankers = topRankingsPage.getContent().stream()
                    .map(ranking -> {
                        Map<String, Object> rankerMap = new HashMap<>();
                        rankerMap.put("rank", ranking.getRankPosition());
                        rankerMap.put("userId", ranking.getUserId());
                        String nickname = "사용자" + ranking.getUserId();
                        try {
                            User user = userService.getUserById(ranking.getUserId());
                            if (user != null && user.getNickname() != null) nickname = user.getNickname();
                        } catch (Exception ignore) {}
                        rankerMap.put("nickname", nickname);
                        rankerMap.put("score", ranking.getTotalScore());
                        rankerMap.put("badge", getBadgeFromScore(ranking.getTotalScore()));
                        rankerMap.put("streakDays", ranking.getStreakDays());
                        return rankerMap;
                    })
                    .toList();
                
                // 현재 사용자의 랭킹 정보 조회
                User currentUser = userService.getUserById(currentUserId);
                Optional<UserRanking> userRankingOpt = userRankingRepository.findByUserId(currentUserId);
                if (userRankingOpt.isPresent()) {
                    UserRanking userRanking = userRankingOpt.get();
                    String nickname = currentUser != null && currentUser.getNickname() != null ? currentUser.getNickname() : ("사용자" + currentUserId);
                    myRanking = Map.of(
                        "rank", userRanking.getRankPosition(),
                        "score", userRanking.getTotalScore(),
                        "streakDays", userRanking.getStreakDays(),
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId,
                        "nickname", nickname
                    );
                } else {
                    myRanking = Map.of(
                        "rank", 0,
                        "score", 0,
                        "streakDays", 0,
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId,
                        "nickname", "사용자" + currentUserId
                    );
                }
                
                         } catch (Exception e) {
                log.warn("랭킹 데이터 조회 실패, 빈 데이터 반환: {}", e.getMessage());
                
                // 랭킹 조회 실패 시 빈 데이터 반환
                topRankers = List.of();
                
                myRanking = Map.of(
                    "rank", 0,
                    "score", 0,
                    "streakDays", 0,
                    "totalUsers", 0,
                    "userId", currentUserId
                );
            }

            // 실제 데이터베이스에서 사용자 업적 조회
            List<Map<String, Object>> achievements = achievementService.getUserAchievements(currentUserId);
            
            log.debug("Retrieved {} achievements for user {}", achievements.size(), currentUserId);

            Map<String, Object> rankingData = Map.of(
                "topRankers", topRankers,
                "myRanking", myRanking,
                "achievements", achievements
            );
            
            return ResponseEntity.ok(rankingData);
            
        } catch (Exception e) {
            log.error("Error getting ranking data", e);
            
            // 에러 발생 시 빈 데이터 반환
            Map<String, Object> fallbackData = Map.of(
                "topRankers", List.of(),
                "myRanking", Map.of("rank", 0, "score", 0, "streakDays", 0, "totalUsers", 0, "userId", 1L),
                "achievements", List.of(),
                "error", "랭킹 데이터를 불러올 수 없습니다. 나중에 다시 시도해주세요."
            );
            
            return ResponseEntity.ok(fallbackData);
        }
    }
    
    /**
     * 점수에 따른 배지 결정
     */
    private String getBadgeFromScore(int score) {
        if (score >= 3000) return "platinum";
        else if (score >= 2500) return "gold";
        else if (score >= 2000) return "silver";
        else return "bronze";
    }

    /**
     * 📅 운동 캘린더 히트맵 데이터 조회
     */
    @GetMapping("/{userId}/exercise-calendar-heatmap")
    public ResponseEntity<List<Map<String, Object>>> getExerciseCalendarHeatmap(
            @PathVariable Long userId,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 운동 캘린더 히트맵 데이터 조회
            List<Map<String, Object>> heatmapData = healthStatisticsService.getExerciseCalendarHeatmapData(tokenUserId);
            
            log.info("운동 캘린더 히트맵 데이터 조회 완료 - 사용자: {}, 데이터 수: {}", tokenUserId, heatmapData.size());
            
            return ResponseEntity.ok(heatmapData);
            
        } catch (RuntimeException e) {
            log.error("운동 캘린더 히트맵 조회 중 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage());
            return ResponseEntity.ok(List.of()); // 빈 리스트 반환
            
        } catch (Exception e) {
            log.error("운동 캘린더 히트맵 조회 중 예상치 못한 오류 발생 - 사용자: {}", userId, e);
            return ResponseEntity.ok(List.of()); // 빈 리스트 반환
        }
    }

    // ============================================================================
    // 중복 엔드포인트 제거 (2024-12-31)
    // ============================================================================
    // 
    // 다음 엔드포인트들은 전용 컨트롤러로 이동되었습니다:
    // 
    // - GET /api/health-statistics/health-records/{userId} 
    //   → GET /api/health-records/{userId} (HealthRecordController)
    // 
    // - GET /api/health-statistics/exercise-sessions/{userId}
    //   → GET /api/exercise-sessions/{userId} (ExerciseSessionController)
    //
    // 프론트엔드에서는 각각의 전용 엔드포인트를 사용하세요.
    // ============================================================================

} 