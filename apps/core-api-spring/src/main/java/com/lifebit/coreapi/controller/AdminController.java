package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.dto.UserDTO;
import com.lifebit.coreapi.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @DeleteMapping("/users/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Long userId) {
        adminService.deleteUserById(userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats(
            @RequestHeader("Authorization") String token) {
        try {
            // 관리자 권한 확인 (필요시 구현)
            Map<String, Object> dashboardStats = adminService.getDashboardStatistics();
            return ResponseEntity.ok(dashboardStats);
        } catch (Exception e) {
            log.error("대시보드 통계 조회 실패", e);
            return ResponseEntity.internalServerError().build();
        }
    }
} 