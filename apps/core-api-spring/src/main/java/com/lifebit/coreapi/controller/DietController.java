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
    public List<DietLogDTO> getDailyRecords(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam Long userId) {
        return dietService.getDailyDietRecords(date, userId);
    }

    @GetMapping("/nutrition-goals/{date}")
    public List<DietNutritionDTO> getNutritionGoals(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date, @RequestParam Long userId) {
        return dietService.getNutritionGoals(date, userId);
    }

    @GetMapping("/calendar-records/{year}/{month}")
    public Map<String, DietCalendarDTO> getCalendarRecords(@PathVariable int year, @PathVariable int month, @RequestParam Long userId) {
        return dietService.getCalendarRecords(userId, year, month);
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

    @GetMapping("/food-items/search")
    public ResponseEntity<List<Map<String, Object>>> searchFoodItems(
            @RequestParam String keyword) {
        List<Map<String, Object>> foodItems = dietService.searchFoodItems(keyword);
        return ResponseEntity.ok(foodItems);
    }
} 