package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.AnalyticsResponseDto.*;
import com.lifebit.coreapi.service.AdminAnalyticsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
@Slf4j
public class AdminAnalyticsController {

    private final AdminAnalyticsService adminAnalyticsService;

    /**
     * 접속 현황 통계 조회
     */
    @GetMapping("/access-stats")
    public ResponseEntity<List<AccessStatsDto>> getAccessStats(
            @RequestParam(defaultValue = "daily") String period) {
        try {
            log.info("✅ [AdminAnalytics] 접속 현황 통계 조회 요청 수신 - 기간: {}", period);
            List<AccessStatsDto> stats = adminAnalyticsService.getAccessStats(period);
            log.info("✅ [AdminAnalytics] 접속 현황 통계 조회 성공 - 데이터 개수: {}", stats.size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 접속 현황 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 사용자 활동 비교 통계 조회
     */
    @GetMapping("/user-activity")
    public ResponseEntity<List<UserActivityDto>> getUserActivityStats(
            @RequestParam(defaultValue = "daily") String period) {
        try {
            log.info("✅ [AdminAnalytics] 사용자 활동 통계 조회 요청 수신 - 기간: {}", period);
            List<UserActivityDto> stats = adminAnalyticsService.getUserActivityStats(period);
            log.info("✅ [AdminAnalytics] 사용자 활동 통계 조회 성공 - 데이터 개수: {}", stats.size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 사용자 활동 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 운동 참여자 통계 조회
     */
    @GetMapping("/exercise-stats")
    public ResponseEntity<List<ExerciseStatsDto>> getExerciseStats(
            @RequestParam(defaultValue = "daily") String period) {
        try {
            log.info("✅ [AdminAnalytics] 운동 참여자 통계 조회 요청 수신 - 기간: {}", period);
            List<ExerciseStatsDto> stats = adminAnalyticsService.getExerciseStats(period);
            log.info("✅ [AdminAnalytics] 운동 참여자 통계 조회 성공 - 데이터 개수: {}", stats.size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 운동 참여자 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 식사 기록 통계 조회
     */
    @GetMapping("/meal-stats")
    public ResponseEntity<List<MealStatsDto>> getMealStats(
            @RequestParam(defaultValue = "daily") String period) {
        try {
            log.info("✅ [AdminAnalytics] 식사 기록 통계 조회 요청 수신 - 기간: {}", period);
            List<MealStatsDto> stats = adminAnalyticsService.getMealStats(period);
            log.info("✅ [AdminAnalytics] 식사 기록 통계 조회 성공 - 데이터 개수: {}", stats.size());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 식사 기록 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 전체 애널리틱스 데이터 조회 (통합)
     */
    @GetMapping("/all")
    public ResponseEntity<AnalyticsDataDto> getAllAnalytics(
            @RequestParam(defaultValue = "daily") String period) {
        log.info("🚀 [AdminAnalytics] ===== 전체 애널리틱스 데이터 조회 요청 수신 =====");
        log.info("🚀 [AdminAnalytics] 요청 파라미터 - 기간: {}", period);
        
        try {
            AnalyticsDataDto result = adminAnalyticsService.getAllAnalytics(period);
            log.info("✅ [AdminAnalytics] 전체 애널리틱스 데이터 조회 성공! 데이터 크기: {}", 
                result != null ? "OK" : "NULL");
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 전체 애널리틱스 데이터 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 실시간 통계 데이터 (WebSocket용)
     */
    @GetMapping("/realtime")
    public ResponseEntity<AnalyticsDataDto> getRealtimeAnalytics() {
        try {
            log.info("📡 [AdminAnalytics] 실시간 애널리틱스 데이터 조회 요청 수신");
            // 기본적으로 일간 데이터를 실시간으로 제공
            AnalyticsDataDto analytics = adminAnalyticsService.getAllAnalytics("daily");
            log.info("✅ [AdminAnalytics] 실시간 애널리틱스 데이터 조회 성공");
            return ResponseEntity.ok(analytics);
        } catch (Exception e) {
            log.error("❌ [AdminAnalytics] 실시간 애널리틱스 데이터 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * 서버 연결 테스트용 간단한 엔드포인트
     */
    @GetMapping("/test")
    public ResponseEntity<String> testConnection() {
        log.info("🧪 [AdminAnalytics] 테스트 엔드포인트 호출됨");
        return ResponseEntity.ok("✅ Admin Analytics API 연결 성공!");
    }
} 