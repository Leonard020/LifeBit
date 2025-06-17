package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.DietLogDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.dto.DietCalendarDTO;
import com.lifebit.coreapi.service.DietService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diet")
@RequiredArgsConstructor
public class DietController {
    private final DietService dietService;

    @GetMapping("/daily-records/{date}")
    public ResponseEntity<List<DietLogDTO>> getDailyRecords(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "1") Long userId) {
        List<DietLogDTO> records = dietService.getDailyDietRecords(userId, date);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/nutrition-goals/{date}")
    public ResponseEntity<List<DietNutritionDTO>> getNutritionGoals(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(defaultValue = "1") Long userId) {
        List<DietNutritionDTO> goals = dietService.getNutritionGoals(userId, date);
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/calendar-records/{year}/{month}")
    public ResponseEntity<Map<String, DietCalendarDTO>> getCalendarRecords(
            @PathVariable int year,
            @PathVariable int month,
            @RequestParam(defaultValue = "1") Long userId) {
        Map<String, DietCalendarDTO> records = dietService.getCalendarRecords(userId, year, month);
        return ResponseEntity.ok(records);
    }

    @PostMapping("/record")
    public ResponseEntity<DietLogDTO> recordDiet(
            @RequestBody DietLogDTO request) {
        DietLogDTO savedRecord = dietService.recordDiet(request);
        return ResponseEntity.ok(savedRecord);
    }

    @PutMapping("/record/{id}")
    public ResponseEntity<DietLogDTO> updateDietRecord(
            @PathVariable Long id,
            @RequestBody DietLogDTO request) {
        DietLogDTO updatedRecord = dietService.updateDietRecord(id, request);
        return ResponseEntity.ok(updatedRecord);
    }

    @DeleteMapping("/record/{id}")
    public ResponseEntity<Void> deleteDietRecord(@PathVariable Long id) {
        dietService.deleteDietRecord(id);
        return ResponseEntity.ok().build();
    }

    
} 