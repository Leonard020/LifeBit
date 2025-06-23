package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.service.NoteExerciseService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/note/exercise")
@RequiredArgsConstructor
public class NoteExerciseController {

    private final NoteExerciseService noteExerciseService;
    private final JwtTokenProvider jwtTokenProvider;

    // ✅ 토큰에서 userId 추출하는 헬퍼 메서드
    private Long extractUserId(String token) {
        if (token.startsWith("Bearer ")) {
            token = token.substring(7);
        }
        return jwtTokenProvider.getUserIdFromToken(token);
    }

    // ✅ 1. 일일 운동 기록 조회 (개별 세션 목록)
    @GetMapping("/daily")
    public ResponseEntity<List<ExerciseRecordDTO>> getDailyExerciseRecords(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = extractUserId(token);
        List<ExerciseRecordDTO> sessions = noteExerciseService.getTodayExerciseRecords(userId, date);
        return ResponseEntity.ok(sessions);
    }

    // ✅ 2. 주간 운동 요약 조회
    @GetMapping("/summary")
    public ResponseEntity<List<NoteExerciseDTO>> getWeeklyExerciseSummary(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        Long userId = extractUserId(token);
        List<NoteExerciseDTO> summary = noteExerciseService.getWeeklyExerciseSummary(userId, weekStart);
        return ResponseEntity.ok(summary);
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