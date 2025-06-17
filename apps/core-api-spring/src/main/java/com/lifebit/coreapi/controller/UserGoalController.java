package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.service.UserGoalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/user-goals")
@RequiredArgsConstructor
public class UserGoalController {
    private final UserGoalService userGoalService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserGoal> getUserGoals(@PathVariable Long userId) {
        UserGoal userGoal = userGoalService.getUserGoal(userId);
        return ResponseEntity.ok(userGoal);
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserGoal> updateUserGoals(
            @PathVariable Long userId,
            @RequestBody UserGoal request) {
        UserGoal updatedGoal = userGoalService.updateUserGoal(userId, request);
        return ResponseEntity.ok(updatedGoal);
    }
} 