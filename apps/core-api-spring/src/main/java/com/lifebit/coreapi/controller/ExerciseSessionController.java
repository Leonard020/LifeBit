package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.service.HealthStatisticsService;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/exercise-sessions")
@RequiredArgsConstructor
@Slf4j
public class ExerciseSessionController {

    private final ExerciseService exerciseService;
    private final HealthStatisticsService healthStatisticsService;
    private final JwtTokenProvider jwtTokenProvider;

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
     * 운동 세션 조회 (통합 서비스 사용)
     * 
     * 2024-12-31: HealthStatisticsService로 리팩토링됨
     * - 일관된 응답 형식
     * - 중복 로직 제거
     */
    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getExerciseSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period,
            HttpServletRequest request) {
        
        try {
            log.info("운동 세션 조회 요청 - 사용자: {}, 기간: {}", userId, period);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(request);
            
            // 🔐 인증된 사용자만 자신의 데이터에 접근 가능
            if (!tokenUserId.equals(userId)) {
                log.warn("권한 없는 접근 시도 - 토큰 사용자: {}, 요청 사용자: {}", tokenUserId, userId);
                return ResponseEntity.status(403).build();
            }
            
            // ✅ 통합된 서비스에서 운동 세션 조회
            List<Map<String, Object>> exerciseSessionsData = healthStatisticsService.getExerciseSessions(tokenUserId, period);
            
            log.info("운동 세션 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                tokenUserId, period, exerciseSessionsData.size());
            
            return ResponseEntity.ok(exerciseSessionsData);
            
        } catch (RuntimeException e) {
            log.error("운동 세션 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage());
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createExerciseSession(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("운동 세션 생성 요청: {}", request);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // ExerciseService의 recordExercise 메소드 사용
            Long catalogId = request.get("exercise_catalog_id") != null ? 
                Long.valueOf(request.get("exercise_catalog_id").toString()) : 1L; // 기본값
            Integer durationMinutes = request.get("duration_minutes") != null ? 
                Integer.valueOf(request.get("duration_minutes").toString()) : null;
            Integer caloriesBurned = request.get("calories_burned") != null ? 
                Integer.valueOf(request.get("calories_burned").toString()) : null;
            String notes = request.get("notes") != null ? 
                request.get("notes").toString() : null;
            
            // 데이터베이스에 저장 (토큰에서 가져온 사용자 ID 사용)
            ExerciseSession savedSession = exerciseService.recordExercise(
                tokenUserId, catalogId, durationMinutes, caloriesBurned, notes);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("exercise_session_id", savedSession.getExerciseSessionId());
            response.put("uuid", savedSession.getUuid() != null ? savedSession.getUuid().toString() : null);
            response.put("user_id", savedSession.getUser() != null ? savedSession.getUser().getUserId() : null);
            response.put("exercise_catalog_id", savedSession.getExerciseCatalog() != null ? savedSession.getExerciseCatalog().getExerciseCatalogId() : null);
            response.put("exercise_name", savedSession.getExerciseCatalog() != null ? savedSession.getExerciseCatalog().getName() : null);
            response.put("duration_minutes", savedSession.getDurationMinutes());
            response.put("calories_burned", savedSession.getCaloriesBurned());
            response.put("weight", savedSession.getWeight() != null ? savedSession.getWeight().doubleValue() : null);
            response.put("reps", savedSession.getReps());
            response.put("sets", savedSession.getSets());
            response.put("notes", savedSession.getNotes());
            response.put("exercise_date", savedSession.getExerciseDate() != null ? savedSession.getExerciseDate().toString() : null);
            response.put("created_at", savedSession.getCreatedAt() != null ? savedSession.getCreatedAt().toString() : null);
            
            log.info("운동 세션 생성 완료 - ID: {}", savedSession.getExerciseSessionId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("운동 세션 생성 중 오류 발생: {}", e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "운동 세션 생성에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 