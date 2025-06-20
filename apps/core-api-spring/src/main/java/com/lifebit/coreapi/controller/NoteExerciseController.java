package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.ExerciseRecordDTO;
import com.lifebit.coreapi.dto.NoteExerciseDTO;
import com.lifebit.coreapi.service.NoteExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/note/exercise")
@RequiredArgsConstructor
public class NoteExerciseController {

    private final NoteExerciseService noteExerciseService;

    // ✅ 일일 운동 기록 (개별 세션 반환)
    @GetMapping("/daily")
    public ResponseEntity<List<ExerciseRecordDTO>> getTodayExerciseSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = Long.parseLong(userDetails.getUsername());
        List<ExerciseRecordDTO> sessions = noteExerciseService.getTodayExerciseRecords(userId, date);
        return ResponseEntity.ok(sessions);
    }

    // ✅ 주간 운동 요약 (집계 요약)
    @GetMapping("/summary")
    public ResponseEntity<List<NoteExerciseDTO>> getWeeklyExerciseSummary(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        Long userId = Long.parseLong(userDetails.getUsername());
        List<NoteExerciseDTO> summary = noteExerciseService.getWeeklyExerciseSummary(userId, weekStart);
        return ResponseEntity.ok(summary);
    }
}