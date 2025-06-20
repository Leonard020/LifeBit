package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.service.ExerciseService;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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

    @GetMapping("/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getExerciseSessions(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "month") String period) {
        
        try {
            log.info("운동 세션 조회 요청 - 사용자: {}, 기간: {}", userId, period);
            
            // 실제 데이터베이스에서 운동 세션 조회
            List<ExerciseSession> exerciseSessions = exerciseService.getRecentExerciseSessions(userId, period);
            
            // ExerciseSession 엔티티를 Map으로 변환
            List<Map<String, Object>> exerciseSessionsData = exerciseSessions.stream()
                .map(session -> {
                    Map<String, Object> sessionMap = new HashMap<>();
                    sessionMap.put("session_id", session.getExerciseSessionId());
                    sessionMap.put("uuid", session.getUuid() != null ? session.getUuid().toString() : null);
                    sessionMap.put("user_id", session.getUser() != null ? session.getUser().getUserId() : null);
                    sessionMap.put("exercise_catalog_id", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getExerciseCatalogId() : null);
                    sessionMap.put("exercise_name", session.getExerciseCatalog() != null ? session.getExerciseCatalog().getName() : "알수없음");
                    sessionMap.put("duration_minutes", session.getDurationMinutes());
                    sessionMap.put("calories_burned", session.getCaloriesBurned());
                    sessionMap.put("weight", session.getWeight() != null ? session.getWeight().doubleValue() : null);
                    sessionMap.put("reps", session.getReps());
                    sessionMap.put("sets", session.getSets());
                    sessionMap.put("notes", session.getNotes());
                    sessionMap.put("exercise_date", session.getExerciseDate() != null ? session.getExerciseDate().toString() : null);
                    sessionMap.put("created_at", session.getCreatedAt() != null ? session.getCreatedAt().toString() : null);
                    return sessionMap;
                })
                .toList();
            
            log.info("운동 세션 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", 
                userId, period, exerciseSessionsData.size());
            
            return ResponseEntity.ok(exerciseSessionsData);
            
        } catch (Exception e) {
            log.error("운동 세션 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", 
                userId, period, e.getMessage(), e);
            
            // 오류 발생 시 빈 리스트 반환
            return ResponseEntity.ok(List.of());
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createExerciseSession(
            @RequestBody Map<String, Object> request) {
        
        try {
            log.info("운동 세션 생성 요청: {}", request);
            
            // ExerciseService의 recordExercise 메소드 사용
            Long userId = Long.valueOf(request.get("user_id").toString());
            Long catalogId = request.get("exercise_catalog_id") != null ? 
                Long.valueOf(request.get("exercise_catalog_id").toString()) : 1L; // 기본값
            Integer durationMinutes = request.get("duration_minutes") != null ? 
                Integer.valueOf(request.get("duration_minutes").toString()) : null;
            Integer caloriesBurned = request.get("calories_burned") != null ? 
                Integer.valueOf(request.get("calories_burned").toString()) : null;
            String notes = request.get("notes") != null ? 
                request.get("notes").toString() : null;
            
            // 데이터베이스에 저장
            ExerciseSession savedSession = exerciseService.recordExercise(
                userId, catalogId, durationMinutes, caloriesBurned, notes);
            
            // 응답 데이터 구성
            Map<String, Object> response = new HashMap<>();
            response.put("session_id", savedSession.getExerciseSessionId());
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