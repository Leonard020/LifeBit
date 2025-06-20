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

    @PutMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> updateExerciseSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("운동 세션 수정 요청 - ID: {}, 데이터: {}", sessionId, request);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // 기존 세션 조회 및 권한 확인
            ExerciseSession existingSession = exerciseService.getExerciseSessionById(sessionId);
            if (existingSession == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "운동 세션을 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 권한 확인: 자신의 세션만 수정 가능
            if (!existingSession.getUser().getUserId().equals(tokenUserId)) {
                log.warn("권한 없는 수정 시도 - 토큰 사용자: {}, 세션 소유자: {}", tokenUserId, existingSession.getUser().getUserId());
                return ResponseEntity.status(403).build();
            }
            
            // 수정할 데이터 적용
            if (request.get("exercise_catalog_id") != null) {
                Long catalogId = Long.valueOf(request.get("exercise_catalog_id").toString());
                ExerciseCatalog catalog = exerciseService.getExerciseCatalogById(catalogId);
                existingSession.setExerciseCatalog(catalog);
            }
            if (request.get("duration_minutes") != null) {
                existingSession.setDurationMinutes(Integer.valueOf(request.get("duration_minutes").toString()));
            }
            if (request.get("calories_burned") != null) {
                existingSession.setCaloriesBurned(Integer.valueOf(request.get("calories_burned").toString()));
            }
            if (request.get("notes") != null) {
                existingSession.setNotes(request.get("notes").toString());
            }
            if (request.get("exercise_date") != null) {
                existingSession.setExerciseDate(LocalDate.parse(request.get("exercise_date").toString()));
            }
            if (request.get("sets") != null) {
                existingSession.setSets(Integer.valueOf(request.get("sets").toString()));
            }
            if (request.get("reps") != null) {
                existingSession.setReps(Integer.valueOf(request.get("reps").toString()));
            }
            if (request.get("weight") != null) {
                existingSession.setWeight(new java.math.BigDecimal(request.get("weight").toString()));
            }
            
            // 데이터베이스에 저장
            ExerciseSession updatedSession = exerciseService.updateExerciseSession(existingSession);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("exercise_session_id", updatedSession.getExerciseSessionId());
            response.put("uuid", updatedSession.getUuid() != null ? updatedSession.getUuid().toString() : null);
            response.put("user_id", updatedSession.getUser() != null ? updatedSession.getUser().getUserId() : null);
            response.put("exercise_catalog_id", updatedSession.getExerciseCatalog() != null ? updatedSession.getExerciseCatalog().getExerciseCatalogId() : null);
            response.put("exercise_name", updatedSession.getExerciseCatalog() != null ? updatedSession.getExerciseCatalog().getName() : null);
            response.put("duration_minutes", updatedSession.getDurationMinutes());
            response.put("calories_burned", updatedSession.getCaloriesBurned());
            response.put("weight", updatedSession.getWeight() != null ? updatedSession.getWeight().doubleValue() : null);
            response.put("reps", updatedSession.getReps());
            response.put("sets", updatedSession.getSets());
            response.put("notes", updatedSession.getNotes());
            response.put("exercise_date", updatedSession.getExerciseDate() != null ? updatedSession.getExerciseDate().toString() : null);
            response.put("created_at", updatedSession.getCreatedAt() != null ? updatedSession.getCreatedAt().toString() : null);
            
            log.info("운동 세션 수정 완료 - ID: {}", updatedSession.getExerciseSessionId());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("운동 세션 수정 중 오류 발생 - ID: {}, 오류: {}", sessionId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "운동 세션 수정에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Map<String, Object>> deleteExerciseSession(
            @PathVariable Long sessionId,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("운동 세션 삭제 요청 - ID: {}", sessionId);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // 기존 세션 조회 및 권한 확인
            ExerciseSession existingSession = exerciseService.getExerciseSessionById(sessionId);
            if (existingSession == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "운동 세션을 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 권한 확인: 자신의 세션만 삭제 가능
            if (!existingSession.getUser().getUserId().equals(tokenUserId)) {
                log.warn("권한 없는 삭제 시도 - 토큰 사용자: {}, 세션 소유자: {}", tokenUserId, existingSession.getUser().getUserId());
                return ResponseEntity.status(403).build();
            }
            
            // 세션 삭제
            exerciseService.deleteExerciseSession(sessionId);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "운동 세션이 성공적으로 삭제되었습니다.");
            
            log.info("운동 세션 삭제 완료 - ID: {}", sessionId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("운동 세션 삭제 중 오류 발생 - ID: {}, 오류: {}", sessionId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "운동 세션 삭제에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getExerciseSession(
            @PathVariable Long sessionId,
            HttpServletRequest httpRequest) {
        
        try {
            log.info("운동 세션 단일 조회 요청 - ID: {}", sessionId);
            
            // 토큰에서 사용자 ID 추출하여 권한 확인
            Long tokenUserId = getUserIdFromToken(httpRequest);
            
            // 세션 조회
            ExerciseSession session = exerciseService.getExerciseSessionById(sessionId);
            if (session == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "운동 세션을 찾을 수 없습니다.");
                return ResponseEntity.notFound().build();
            }
            
            // 권한 확인: 자신의 세션만 조회 가능
            if (!session.getUser().getUserId().equals(tokenUserId)) {
                log.warn("권한 없는 조회 시도 - 토큰 사용자: {}, 세션 소유자: {}", tokenUserId, session.getUser().getUserId());
                return ResponseEntity.status(403).build();
            }
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("exercise_session_id", session.getExerciseSessionId());
            response.put("uuid", session.getUuid() != null ? session.getUuid().toString() : null);
            response.put("user_id", session.getUser() != null ? session.getUser().getUserId() : null);
            response.put("exercise_catalog_id", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getExerciseCatalogId() : null);
            response.put("exercise_name", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getName() : null);
            response.put("duration_minutes", session.getDurationMinutes());
            response.put("calories_burned", session.getCaloriesBurned());
            response.put("weight", session.getWeight() != null ? session.getWeight().doubleValue() : null);
            response.put("reps", session.getReps());
            response.put("sets", session.getSets());
            response.put("notes", session.getNotes());
            response.put("exercise_date", session.getExerciseDate() != null ? session.getExerciseDate().toString() : null);
            response.put("created_at", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
            
            log.info("운동 세션 단일 조회 완료 - ID: {}", sessionId);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("운동 세션 단일 조회 중 오류 발생 - ID: {}, 오류: {}", sessionId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "운동 세션 조회에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }
} 