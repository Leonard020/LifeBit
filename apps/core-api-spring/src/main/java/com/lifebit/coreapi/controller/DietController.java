package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.DietDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.service.DietService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/diet")
@RequiredArgsConstructor
public class DietController {
    private final DietService dietService;

    @GetMapping("/daily-records/{date}")
    public ResponseEntity<List<DietDTO>> getDailyMealLogs(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestAttribute Long userId
    ) {
        return ResponseEntity.ok(dietService.getDailyMealLogs(userId, date));
    }

    @GetMapping("/nutrition-goals/{date}")
    public ResponseEntity<List<DietNutritionDTO>> getDailyNutritionGoals(
        @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
        @RequestAttribute Long userId
    ) {
        return ResponseEntity.ok(dietService.getDailyNutritionGoals(userId, date));
    }
} 