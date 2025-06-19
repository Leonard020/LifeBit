package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.ExerciseRecordRequest;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {
    private final ExerciseService exerciseService;

    @PostMapping("/record")
    public ResponseEntity<ExerciseSession> recordExercise(
            @RequestBody ExerciseRecordRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        ExerciseSession session = exerciseService.recordExercise(
            Long.parseLong(userDetails.getUsername()),
            request.getCatalogId(),
            request.getDurationMinutes(),
            request.getCaloriesBurned(),
            request.getNotes()
        );
        return ResponseEntity.ok(session);
    }

    @GetMapping("/history")
    public ResponseEntity<List<ExerciseSession>> getExerciseHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ExerciseSession> history = exerciseService.getExerciseHistory(
            new User(Long.parseLong(userDetails.getUsername())),
            startDate,
            endDate
        );
        return ResponseEntity.ok(history);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ExerciseCatalog>> searchExercises(
            @RequestParam String keyword) {
        return ResponseEntity.ok(exerciseService.searchExercises(keyword));
    }

    @GetMapping("/by-body-part/{bodyPart}")
    public ResponseEntity<List<ExerciseCatalog>> getExercisesByBodyPart(
            @PathVariable String bodyPart) {
        return ResponseEntity.ok(exerciseService.getExercisesByBodyPart(bodyPart));
    }

    @PostMapping("/find-or-create")
    public ResponseEntity<ExerciseCatalog> findOrCreateExercise(@RequestBody Map<String, Object> request) {
        String name = (String) request.get("name");
        String bodyPart = (String) request.get("bodyPart");
        String description = (String) request.get("description");
        
        ExerciseCatalog exercise = exerciseService.findOrCreateExercise(name, bodyPart, description);
        return ResponseEntity.ok(exercise);
    }
} 