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
import com.lifebit.coreapi.dto.ExerciseSessionResponse;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.lifebit.coreapi.entity.TimePeriodType;

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
    public ResponseEntity<List<ExerciseSessionResponse>> getExerciseSessions(
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
            List<Map<String, Object>> exerciseSessionsData = healthStatisticsService.getExerciseSessions(tokenUserId,
                    period);
            // Map -> ExerciseSessionResponse 변환 (필드명 일치 가정)
            List<ExerciseSessionResponse> responseList = exerciseSessionsData.stream()
                    .map(data -> {
                        ExerciseSessionResponse dto = new ExerciseSessionResponse();
                        dto.setExerciseSessionId((Long) data.get("exercise_session_id"));
                        dto.setUuid((String) data.get("uuid"));
                        dto.setUserId((Long) data.get("user_id"));
                        dto.setExerciseCatalogId((Long) data.get("exercise_catalog_id"));
                        dto.setExerciseName((String) data.get("exercise_name"));
                        dto.setDurationMinutes((Integer) data.get("duration_minutes"));
                        dto.setCaloriesBurned((Integer) data.get("calories_burned"));
                        dto.setWeight(data.get("weight") != null ? ((Number) data.get("weight")).doubleValue() : null);
                        dto.setReps((Integer) data.get("reps"));
                        dto.setSets((Integer) data.get("sets"));
                        dto.setNotes((String) data.get("notes"));
                        dto.setExerciseDate((String) data.get("exercise_date"));
                        dto.setTimePeriod(
                                data.get("time_period") != null ? data.get("time_period").toString() : null);
                        dto.setCreatedAt((String) data.get("created_at"));
                        return dto;
                    })
                    .toList();

            log.info("운동 세션 조회 완료 - 사용자: {}, 기간: {}, 개수: {}", tokenUserId, period, responseList.size());

            return ResponseEntity.ok(responseList);

        } catch (RuntimeException e) {
            log.error("운동 세션 조회 중 오류 발생 - 사용자: {}, 기간: {}, 오류: {}", userId, period, e.getMessage());
            return ResponseEntity.ok(List.of());
        }
    }

    // 시간대 자동 분류 함수
    private TimePeriodType getTimePeriodByHour(int hour) {
        if (hour >= 5 && hour < 12)
            return TimePeriodType.morning;
        if (hour >= 12 && hour < 18)
            return TimePeriodType.afternoon;
        if (hour >= 18 && hour < 22)
            return TimePeriodType.evening;
        return TimePeriodType.night;
    }

    @PostMapping
    public ResponseEntity<ExerciseSessionResponse> createExerciseSession(
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        try {
            log.info("운동 세션 생성 요청: {}", request);

            Long tokenUserId = getUserIdFromToken(httpRequest);
            // Long catalogId = request.get("exercise_catalog_id") != null
            // ? Long.valueOf(request.get("exercise_catalog_id").toString())    //오류최소화를위해 수정
            // : 1L;
            Long catalogId = null;

            // 1. exercise_catalog_id가 있으면 그대로 사용
            if (request.get("exercise_catalog_id") != null) {
                catalogId = Long.valueOf(request.get("exercise_catalog_id").toString());
            } else if (request.get("exercise_name") != null) {
                // 2. 없으면 exercise_name/body_part/description으로 findOrCreate
                String exerciseName = request.get("exercise_name").toString();
                String bodyPart = request.getOrDefault("body_part", "cardio").toString();
                String description = request.getOrDefault("description", "").toString();
                ExerciseCatalog catalog = exerciseService.findOrCreateExercise(exerciseName, bodyPart, description);  //일단 오류 최소화
                catalogId = catalog.getExerciseCatalogId();
            } else {
                // 3. 아무 정보도 없으면 기본값(1L)
                catalogId = 1L;
            }

            Integer durationMinutes = request.get("duration_minutes") != null
                    ? Integer.valueOf(request.get("duration_minutes").toString())
                    : null;
            Integer caloriesBurned = request.get("calories_burned") != null
                    ? Integer.valueOf(request.get("calories_burned").toString())
                    : null;
            String notes = request.get("notes") != null ? request.get("notes").toString() : null;
            java.time.LocalDate exerciseDate = request.get("exercise_date") != null
                    ? java.time.LocalDate.parse(request.get("exercise_date").toString())
                    : java.time.LocalDate.now();
            // timePeriod 처리: 프론트엔드에서 보낸 값 우선, 없으면 현재 시간 기준
            TimePeriodType timePeriod = null;
            if (request.get("timePeriod") != null) {
                String timePeriodStr = request.get("timePeriod").toString();
                try {
                    timePeriod = TimePeriodType.valueOf(timePeriodStr);
                } catch (IllegalArgumentException e) {
                    log.warn("잘못된 timePeriod 값: {}, 현재 시간 기준으로 설정", timePeriodStr);
                    timePeriod = getTimePeriodByHour(java.time.LocalTime.now().getHour());
                }
            } else {
                timePeriod = getTimePeriodByHour(java.time.LocalTime.now().getHour());
            }

            // ✅ 운동 카탈로그 조회하여 유산소 운동인지 확인
            ExerciseCatalog catalog = exerciseService.getExerciseCatalogById(catalogId);
            if (catalog == null) {
                log.error("운동 카탈로그를 찾을 수 없습니다 - catalogId: {}", catalogId);
                return ResponseEntity.badRequest().build();
            }

            // sets, reps, weight 값 처리 (유산소 운동인 경우 자동 조정) cardio/bodyPart 분기 하드코딩 삭제
            Integer finalSets = request.get("sets") != null ? Integer.valueOf(request.get("sets").toString()) : null;
            Integer finalReps = request.get("reps") != null ? Integer.valueOf(request.get("reps").toString()) : null;
            Double finalWeight = request.get("weight") != null ? Double.valueOf(request.get("weight").toString()) : null;

            ExerciseSession savedSession = exerciseService.recordExercise(
                    tokenUserId,
                    catalogId,
                    durationMinutes,
                    caloriesBurned,
                    notes,
                    finalSets,
                    finalReps,
                    finalWeight,
                    exerciseDate,
                    timePeriod);

            log.info("운동 세션 생성 완료 - ID: {}", savedSession.getExerciseSessionId());

            return ResponseEntity.ok(new ExerciseSessionResponse(savedSession));

        } catch (Exception e) {
            log.error("운동 세션 생성 중 오류 발생: {}", e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{sessionId}")
    public ResponseEntity<?> updateExerciseSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, Object> request,
            HttpServletRequest httpRequest) {

        try {
            log.info("운동 세션 수정 요청 - ID: {}, 데이터: {}", sessionId, request);

            // 토큰에서 사용자 ID 추출
            Long tokenUserId = getUserIdFromToken(httpRequest);

            // 기존 세션 조회
            ExerciseSession existingSession = exerciseService.getExerciseSessionById(sessionId);
            if (existingSession == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "운동 세션을 찾을 수 없습니다.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            // 권한 확인
            if (!existingSession.getUser().getUserId().equals(tokenUserId)) {
                log.warn("권한 없는 수정 시도 - 토큰 사용자: {}, 세션 소유자: {}", tokenUserId, existingSession.getUser().getUserId());
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", "본인의 운동 기록만 수정할 수 있습니다.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
            }

            // 수정할 데이터 적용
            if (request.get("exercise_catalog_id") != null) {
                Long catalogId = Long.valueOf(request.get("exercise_catalog_id").toString());
                existingSession = exerciseService.setExerciseCatalog(existingSession, catalogId);
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

            // 저장
            ExerciseSession updatedSession = exerciseService.updateExerciseSession(existingSession);

            // 🧨 Lazy loading 방지용 강제 초기화
            updatedSession.getExerciseCatalog().getName(); // exerciseCatalog 초기화
            updatedSession.getUser().getUserId(); // user 초기화

            return ResponseEntity.ok(new ExerciseSessionResponse(updatedSession));

        } catch (Exception e) {
            log.error("[운동 세션 수정] 서버 내부 오류 - ID: {}, 요청 데이터: {}, 오류: {}", sessionId, request, e.getMessage(), e);
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "운동 세션 수정에 실패했습니다. (서버 내부 오류)");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
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
    public ResponseEntity<ExerciseSessionResponse> getExerciseSession(
            @PathVariable Long sessionId,
            HttpServletRequest httpRequest) {

        try {
            log.info("운동 세션 단일 조회 요청 - ID: {}", sessionId);

            Long tokenUserId = getUserIdFromToken(httpRequest);
            ExerciseSession session = exerciseService.getExerciseSessionById(sessionId);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }
            if (!session.getUser().getUserId().equals(tokenUserId)) {
                log.warn("권한 없는 조회 시도 - 토큰 사용자: {}, 세션 소유자: {}", tokenUserId, session.getUser().getUserId());
                return ResponseEntity.status(403).build();
            }
            log.info("운동 세션 단일 조회 완료 - ID: {}", sessionId);
            return ResponseEntity.ok(new ExerciseSessionResponse(session));

        } catch (Exception e) {
            log.error("운동 세션 단일 조회 중 오류 발생 - ID: {}, 오류: {}", sessionId, e.getMessage(), e);
            return ResponseEntity.badRequest().build();
        }
    }
}