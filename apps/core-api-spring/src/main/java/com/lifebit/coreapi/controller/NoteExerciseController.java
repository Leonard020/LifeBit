package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.service.NoteExerciseService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import com.lifebit.coreapi.dto.NoteExerciseDTO;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/note/exercise")
@RequiredArgsConstructor
public class NoteExerciseController {

    private final NoteExerciseService noteExerciseService;

    @GetMapping("/daily")
    public ResponseEntity<List<NoteExerciseDTO>> getTodayExerciseSessions(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Long userId = Long.parseLong(userDetails.getUsername());
        List<NoteExerciseDTO> sessions = noteExerciseService.getTodayExerciseRecords(userId, date);
        return ResponseEntity.ok(sessions);
    }
}