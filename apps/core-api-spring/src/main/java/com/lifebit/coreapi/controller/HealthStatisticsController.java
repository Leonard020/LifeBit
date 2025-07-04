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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;
import com.lifebit.coreapi.entity.enums.RankingTier;

@RestController
@RequestMapping({"/api/health-statistics", "/health-statistics"})
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
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}, IP: {}, User-Agent: {}", 
                        tokenUserId, userId, 
                        request.getRemoteAddr(), 
                        request.getHeader("User-Agent"));
                
                // 🔧 개발 환경에서는 더 자세한 정보 로그
                String bearerToken = request.getHeader("Authorization");
                if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                    String token = bearerToken.substring(7);
                    log.debug("토큰 정보: {}", token.length() > 20 ? token.substring(0, 20) + "..." : token);
                }
                
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 통합된 서비스에서 건강 통계 조회
            Map<String, Object> statistics = healthStatisticsService.getHealthStatistics(tokenUserId, period);
            
            // 🍽️ period가 'day'인 경우 실제 영양소 통계 추가
            if ("day".equals(period)) {
                log.info("🍽️ [Controller] 영양소 통계 조회 시작 - 사용자: {}, 기간: {}", tokenUserId, period);
                Map<String, Object> nutritionStats = healthStatisticsService.getRealMealNutritionStatistics(tokenUserId, period);
                log.info("🍽️ [Controller] 영양소 통계 조회 결과: {}", nutritionStats);
                statistics.putAll(nutritionStats);
                log.info("🍽️ [Controller] 영양소 통계 추가 완료 - 사용자: {}, 칼로리: {}, 데이터 출처: {}", 
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
                        String profileImageUrl = null;
                        try {
                            User user = userService.getUserById(ranking.getUserId());
                            if (user != null) {
                                if (user.getNickname() != null) nickname = user.getNickname();
                                profileImageUrl = user.getProfileImageUrl();
                            }
                        } catch (Exception ignore) {}
                        rankerMap.put("nickname", nickname);
                        rankerMap.put("profileImageUrl", profileImageUrl);
                        rankerMap.put("score", ranking.getTotalScore());
                        rankerMap.put("badge", getBadgeFromScore(ranking.getTotalScore()));
                        rankerMap.put("streakDays", ranking.getStreakDays());
                        RankingTier tier = ranking.getTier() != null ? ranking.getTier() : RankingTier.UNRANK;
                        rankerMap.put("tier", tier.name());
                        rankerMap.put("colorCode", tier.getColorCode());
                        return rankerMap;
                    })
                    .toList();
                
                // 현재 사용자의 랭킹 정보 조회 (없으면 자동 생성)
                User currentUser = userService.getUserById(currentUserId);
                Optional<UserRanking> userRankingOpt = userRankingRepository.findActiveByUserId(currentUserId);
                
                // 사용자 랭킹이 없으면 자동 생성
                if (userRankingOpt.isEmpty()) {
                    log.info("🏅 사용자 {}의 랭킹 데이터가 없어서 자동 생성합니다", currentUserId);
                    UserRanking newRanking = createDefaultUserRanking(currentUserId);
                    userRankingOpt = Optional.of(userRankingRepository.save(newRanking));
                }
                
                if (userRankingOpt.isPresent()) {
                    UserRanking userRanking = userRankingOpt.get();
                    String nickname = currentUser != null && currentUser.getNickname() != null ? currentUser.getNickname() : ("사용자" + currentUserId);
                    RankingTier myTier = userRanking.getTier() != null ? userRanking.getTier() : RankingTier.UNRANK;
                    myRanking = Map.of(
                        "rank", userRanking.getRankPosition(),
                        "score", userRanking.getTotalScore(),
                        "streakDays", userRanking.getStreakDays(),
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId,
                        "nickname", nickname,
                        "tier", myTier.name(),
                        "colorCode", myTier.getColorCode()
                    );
                } else {
                    myRanking = Map.of(
                        "rank", 0,
                        "score", 0,
                        "streakDays", 0,
                        "totalUsers", userRankingRepository.count(),
                        "userId", currentUserId,
                        "nickname", "사용자" + currentUserId,
                        "tier", RankingTier.UNRANK.name(),
                        "colorCode", RankingTier.UNRANK.getColorCode()
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
                    "userId", currentUserId,
                    "tier", RankingTier.UNRANK.name(),
                    "colorCode", RankingTier.UNRANK.getColorCode()
                );
            }

            // 실제 데이터베이스에서 사용자 업적 조회
            List<Map<String, Object>> achievements = achievementService.getUserAchievements(currentUserId);
            
            // 업적이 없으면 초기화
            if (achievements.isEmpty()) {
                achievementService.initializeUserAchievements(currentUserId);
                achievements = achievementService.getUserAchievements(currentUserId);
            }
            
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
     * 기본 사용자 랭킹 생성
     */
    private UserRanking createDefaultUserRanking(Long userId) {
        UserRanking ranking = new UserRanking();
        ranking.setUserId(userId);
        ranking.setTotalScore(0);
        ranking.setStreakDays(0);
        ranking.setRankPosition(0);
        ranking.setSeason(getCurrentSeason());
        ranking.setActive(true);
        ranking.setTier(RankingTier.UNRANK);
        ranking.setCreatedAt(java.time.LocalDateTime.now());
        ranking.setLastUpdatedAt(java.time.LocalDateTime.now());
        return ranking;
    }

    /**
     * 현재 시즌 계산
     */
    private int getCurrentSeason() {
        return java.time.LocalDateTime.now().getYear();
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

    /**
     * 사용자 업적 초기화
     */
    @PostMapping("/achievements/initialize")
    public ResponseEntity<Map<String, Object>> initializeAchievements(@AuthenticationPrincipal UserDetails userDetails) {
        try {
            Long currentUserId = Long.parseLong(userDetails.getUsername());
            achievementService.initializeUserAchievements(currentUserId);
            
            Map<String, Object> response = Map.of(
                "message", "업적이 성공적으로 초기화되었습니다.",
                "userId", currentUserId
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error initializing achievements", e);
            
            Map<String, Object> errorResponse = Map.of(
                "error", "업적 초기화에 실패했습니다.",
                "message", e.getMessage()
            );
            
            return ResponseEntity.badRequest().body(errorResponse);
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

    /**
     * 건강로그 페이지 전용 - 주간 운동 부위별 세트 수 통계 조회
     * 기존 통계 API와 충돌하지 않는 별도 엔드포인트
     */
    @GetMapping("/{userId}/healthlog-counts")
    public ResponseEntity<Map<String, Object>> getHealthlogCountsStatistics(
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
            
            // ✅ 건강로그용 횟수 통계 조회 (기존 API와 분리된 메서드 사용)
            Map<String, Object> statistics = healthStatisticsService.getHealthStatistics_healthloguse(tokenUserId);
            
            log.info("건강로그용 횟수 통계 조회 완료 - 사용자: {}, 데이터 항목: {}", tokenUserId, statistics.size());
            
            return ResponseEntity.ok(statistics);
            
        } catch (RuntimeException e) {
            log.error("건강로그용 세트 통계 조회 중 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage());
            
            // 오류 시 기본값 반환
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("weeklyChestCounts_healthloguse", 0);
            fallback.put("weeklyBackCounts_healthloguse", 0);
            fallback.put("weeklyLegsCounts_healthloguse", 0);
            fallback.put("weeklyShouldersCounts_healthloguse", 0);
            fallback.put("weeklyArmsCounts_healthloguse", 0);
            fallback.put("weeklyAbsCounts_healthloguse", 0);
            fallback.put("weeklyCardioCounts_healthloguse", 0);
            fallback.put("weeklyTotalCounts_healthloguse", 0);
            fallback.put("error", "건강로그용 통계 조회 중 오류가 발생했습니다.");
            
            return ResponseEntity.ok(fallback);
            
        } catch (Exception e) {
            log.error("건강로그용 횟수 통계 조회 중 예상치 못한 오류 발생 - 사용자: {}", userId, e);
            
            // 예상치 못한 오류에 대한 안전한 응답
            Map<String, Object> fallback = new HashMap<>();
            fallback.put("weeklyChestCounts_healthloguse", 0);
            fallback.put("weeklyBackCounts_healthloguse", 0);
            fallback.put("weeklyLegsCounts_healthloguse", 0);
            fallback.put("weeklyShouldersCounts_healthloguse", 0);
            fallback.put("weeklyArmsCounts_healthloguse", 0);
            fallback.put("weeklyAbsCounts_healthloguse", 0);
            fallback.put("weeklyCardioCounts_healthloguse", 0);
            fallback.put("weeklyTotalCounts_healthloguse", 0);
            fallback.put("error", "서버 오류가 발생했습니다. 관리자에게 문의해주세요.");
            
            return ResponseEntity.ok(fallback);
        }
    }

    /**
     * 운동 목표 달성 시 점수 추가 API
     */
    @PostMapping("/{userId}/add-exercise-score")
    public ResponseEntity<Map<String, Object>> addExerciseAchievementScore(
            @PathVariable Long userId,
            @RequestParam int achievementCount,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 운동 목표 달성 점수 추가
            rankingService.addExerciseAchievementScore(tokenUserId, achievementCount);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "운동 목표 달성 점수가 추가되었습니다.");
            response.put("achievementCount", achievementCount);
            response.put("userId", tokenUserId);
            
            log.info("운동 목표 달성 점수 추가 완료 - 사용자: {}, 달성 횟수: {}", tokenUserId, achievementCount);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("운동 목표 달성 점수 추가 실패 - 사용자: {}, 달성 횟수: {}, 오류: {}", 
                    userId, achievementCount, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "운동 목표 달성 점수 추가에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 식단 목표 달성 시 점수 추가 API
     */
    @PostMapping("/{userId}/add-nutrition-score")
    public ResponseEntity<Map<String, Object>> addNutritionAchievementScore(
            @PathVariable Long userId,
            @RequestParam boolean isDailyGoalAchieved,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 식단 목표 달성 점수 추가
            rankingService.addNutritionAchievementScore(tokenUserId, isDailyGoalAchieved);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "식단 목표 달성 점수가 추가되었습니다.");
            response.put("isDailyGoalAchieved", isDailyGoalAchieved);
            response.put("scoreAdded", isDailyGoalAchieved ? 1 : 0);
            response.put("userId", tokenUserId);
            
            log.info("식단 목표 달성 점수 추가 완료 - 사용자: {}, 목표 달성: {}, 추가 점수: {}", 
                    tokenUserId, isDailyGoalAchieved, isDailyGoalAchieved ? 1 : 0);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("식단 목표 달성 점수 추가 실패 - 사용자: {}, 목표 달성: {}, 오류: {}", 
                    userId, isDailyGoalAchieved, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "식단 목표 달성 점수 추가에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * 증분 점수 업데이트 API (범용)
     */
    @PostMapping("/{userId}/add-incremental-score")
    public ResponseEntity<Map<String, Object>> addIncrementalScore(
            @PathVariable Long userId,
            @RequestParam int scoreToAdd,
            @RequestParam String scoreType,
            HttpServletRequest request) {
        
        try {
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 증분 점수 업데이트
            rankingService.addIncrementalScore(tokenUserId, scoreToAdd, scoreType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "점수가 성공적으로 추가되었습니다.");
            response.put("scoreAdded", scoreToAdd);
            response.put("scoreType", scoreType);
            response.put("userId", tokenUserId);
            
            log.info("증분 점수 업데이트 완료 - 사용자: {}, 추가 점수: {}, 점수 타입: {}", 
                    tokenUserId, scoreToAdd, scoreType);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("증분 점수 업데이트 실패 - 사용자: {}, 추가 점수: {}, 점수 타입: {}, 오류: {}", 
                    userId, scoreToAdd, scoreType, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "점수 추가에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

} 