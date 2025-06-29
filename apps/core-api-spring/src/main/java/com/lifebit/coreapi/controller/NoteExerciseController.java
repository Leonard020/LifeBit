package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.service.NoteExerciseService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/note/exercise")
@RequiredArgsConstructor
public class NoteExerciseController {

    private final NoteExerciseService noteExerciseService;
    private final JwtTokenProvider jwtTokenProvider;
    private static final Logger log = LoggerFactory.getLogger(NoteExerciseController.class);

    // ✅ 토큰에서 userId 추출하는 헬퍼 메서드
    private Long extractUserId(String token) {
        try {
            log.debug("토큰에서 사용자 ID 추출 시작 - 토큰 길이: {}", token != null ? token.length() : 0);
            
            if (token == null || token.trim().isEmpty()) {
                log.error("토큰이 null이거나 비어있습니다.");
                throw new RuntimeException("Authorization token is required");
            }
            
            if (token.startsWith("Bearer ")) {
                token = token.substring(7);
                log.debug("Bearer 접두사 제거 완료 - 새 토큰 길이: {}", token.length());
            } else {
                log.warn("Bearer 접두사가 없는 토큰입니다.");
            }
            
            if (token.trim().isEmpty()) {
                log.error("Bearer 접두사 제거 후 토큰이 비어있습니다.");
                throw new RuntimeException("Invalid token format");
            }
            
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            log.debug("사용자 ID 추출 성공: {}", userId);
            
            if (userId == null) {
                log.error("토큰에서 사용자 ID를 추출할 수 없습니다.");
                throw new RuntimeException("Cannot extract user ID from token");
            }
            
            return userId;
            
        } catch (Exception e) {
            log.error("[extractUserId] 토큰에서 사용자 ID 추출 실패: {}", e.getMessage(), e);
            throw new RuntimeException("Token validation failed: " + e.getMessage(), e);
        }
    }

    // ✅ 1. 일일 운동 기록 조회 (개별 세션 목록)
    @GetMapping("/daily")
    public ResponseEntity<List<ExerciseRecordDTO>> getDailyExerciseRecords(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        
        try {
            log.info("일일 운동 기록 조회 요청 - 날짜: {}, 토큰: {}...", date, token.substring(0, Math.min(token.length(), 20)));
            
            Long userId = extractUserId(token);
            log.info("추출된 사용자 ID: {}", userId);
            
            List<ExerciseRecordDTO> sessions = noteExerciseService.getTodayExerciseRecords(userId, date);
            log.info("조회된 운동 기록 수: {}", sessions.size());
            
            return ResponseEntity.ok(sessions);
            
        } catch (Exception e) {
            log.error("일일 운동 기록 조회 중 오류 발생 - 날짜: {}, 오류: {}", date, e.getMessage(), e);
            return ResponseEntity.status(500).body(List.of());
        }
    }

    // ✅ 2. 주간 운동 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<List<NoteExerciseDTO>> getWeeklyExerciseSummary(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        try {
        Long userId = extractUserId(token);
        List<NoteExerciseDTO> summary = noteExerciseService.getWeeklyExerciseSummary(userId, weekStart);
        return ResponseEntity.ok(summary);
        } catch (Exception e) {
            log.error("[NoteExerciseController] 주간 운동 요약 조회 실패: {}", e.getMessage(), e);
            return ResponseEntity.status(403).body(List.of()); // 403 Forbidden 명확히 반환
        }
    }

    // ✅ 3. 운동 기록 추가
    @PostMapping
    public ResponseEntity<ExerciseRecordDTO> addExercise(
            @RequestHeader("Authorization") String token,
            @RequestBody ExerciseRecordDTO dto) {
        Long userId = extractUserId(token);
        dto.setUserId(userId); // ✨ 사용자 ID 설정
        ExerciseRecordDTO saved = noteExerciseService.addExercise(dto);
        return ResponseEntity.ok(saved);
    }

    // ✅ 4. 운동 기록 삭제
    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> deleteExercise(
            @RequestHeader("Authorization") String token,
            @PathVariable Long sessionId) {
        Long userId = extractUserId(token);
        noteExerciseService.deleteExercise(sessionId, userId);
        return ResponseEntity.noContent().build();
    }

    // ✅ 5. 운동 기록 수정
    @PutMapping("/{sessionId}")
    public ResponseEntity<ExerciseRecordDTO> updateExercise(
            @RequestHeader("Authorization") String token,
            @PathVariable Long sessionId,
            @RequestBody ExerciseRecordDTO dto) {
        Long userId = extractUserId(token);
        ExerciseRecordDTO updated = noteExerciseService.updateExercise(sessionId, userId, dto);
        return ResponseEntity.ok(updated);
    }
}