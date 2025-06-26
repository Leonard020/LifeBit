package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.ExerciseRecordRequest;
import com.lifebit.coreapi.dto.ExerciseSessionResponse;
import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.security.JwtTokenProvider;
import com.lifebit.coreapi.service.ExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/exercises")
@RequiredArgsConstructor
public class ExerciseController {
    private final ExerciseService exerciseService;
    private final JwtTokenProvider jwtTokenProvider;

    // 시간대 자동 분류 함수
    private com.lifebit.coreapi.entity.TimePeriodType getTimePeriodByHour(int hour) {
        if (hour >= 5 && hour < 12) return com.lifebit.coreapi.entity.TimePeriodType.morning;
        if (hour >= 12 && hour < 18) return com.lifebit.coreapi.entity.TimePeriodType.afternoon;
        if (hour >= 18 && hour < 22) return com.lifebit.coreapi.entity.TimePeriodType.evening;
        return com.lifebit.coreapi.entity.TimePeriodType.night;
    }

    @PostMapping("/record")
    public ResponseEntity<ExerciseSessionResponse> recordExercise(
            @RequestHeader("Authorization") String token,
            @RequestBody ExerciseRecordRequest request) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        com.lifebit.coreapi.entity.TimePeriodType timePeriod = getTimePeriodByHour(java.time.LocalTime.now().getHour());
        ExerciseSession session = exerciseService.recordExercise(
            userId,
            request.getCatalogId(),
            request.getDurationMinutes(),
            request.getCaloriesBurned(),
            request.getNotes(),
            request.getSets(),
            request.getReps(),
            request.getWeight(),
            request.getExerciseDate(),
            timePeriod
        );
        return ResponseEntity.ok(new ExerciseSessionResponse(session));
    }

    @GetMapping("/history")
    public ResponseEntity<List<ExerciseSessionResponse>> getExerciseHistory(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        Long userId = jwtTokenProvider.getUserIdFromToken(token);
        List<ExerciseSession> history = exerciseService.getExerciseHistory(
            new User(userId), startDate, endDate);
        List<ExerciseSessionResponse> responseList = history.stream()
            .map(ExerciseSessionResponse::new)
            .toList();
        return ResponseEntity.ok(responseList);
    }

    @GetMapping("/search")
    public ResponseEntity<List<ExerciseCatalog>> searchExercises(@RequestParam String keyword) {
        return ResponseEntity.ok(exerciseService.searchExercises(keyword));
    }

    @GetMapping("/by-body-part/{bodyPart}")
    public ResponseEntity<List<ExerciseCatalog>> getExercisesByBodyPart(@PathVariable String bodyPart) {
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

    @GetMapping("/catalog")
    public ResponseEntity<List<ExerciseCatalog>> getExerciseCatalog() {
        List<ExerciseCatalog> catalog = exerciseService.getAllExerciseCatalog();
        return ResponseEntity.ok(catalog);
    }
}