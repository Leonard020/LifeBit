package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.service.UserGoalService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user-goals")
@RequiredArgsConstructor
@Slf4j
public class UserGoalController {
    private final UserGoalService userGoalService;
    private final JwtTokenProvider jwtTokenProvider;

    @GetMapping("/{userId}")
    public ResponseEntity<UserGoal> getUserGoals(
            @PathVariable Long userId,
            HttpServletRequest request) {
        
        try {
            // JWT에서 사용자 ID 추출하여 권한 확인
            String bearerToken = request.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                
                log.info("사용자 목표 조회 요청 - 요청 사용자: {}, 토큰 사용자: {}", userId, tokenUserId);
                
                // 권한 확인: 자신의 목표만 조회 가능
                if (!tokenUserId.equals(userId)) {
                    log.warn("권한 없음 - 요청 사용자: {}, 토큰 사용자: {}", userId, tokenUserId);
                    return ResponseEntity.status(403).build();
                }
                
                // 사용자 목표 조회 또는 생성
                UserGoal userGoal = userGoalService.getOrCreateUserGoal(userId);
                log.info("사용자 목표 조회 성공 - 사용자: {}, 목표: {}", userId, userGoal);
                
                return ResponseEntity.ok(userGoal);
            } else {
                log.warn("Authorization 헤더가 없거나 잘못된 형식 - 사용자: {}", userId);
                return ResponseEntity.status(401).build();
            }
            
        } catch (Exception e) {
            log.error("사용자 목표 조회 중 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage(), e);
            
            // 오류 발생 시에도 기본 목표 반환
            try {
                UserGoal defaultGoal = userGoalService.getOrCreateUserGoal(userId);
                return ResponseEntity.ok(defaultGoal);
            } catch (Exception ex) {
                log.error("기본 목표 생성 실패 - 사용자: {}, 오류: {}", userId, ex.getMessage());
                return ResponseEntity.status(500).build();
            }
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserGoal> updateUserGoals(
            @PathVariable Long userId,
            @RequestBody UserGoal request,
            HttpServletRequest httpRequest) {
        
        try {
            // JWT에서 사용자 ID 추출하여 권한 확인
            String bearerToken = httpRequest.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                
                // 권한 확인: 자신의 목표만 수정 가능
                if (!tokenUserId.equals(userId)) {
                    return ResponseEntity.status(403).build();
                }
                
                UserGoal updatedGoal = userGoalService.updateUserGoal(userId, request);
                return ResponseEntity.ok(updatedGoal);
            } else {
                return ResponseEntity.status(401).build();
            }
            
        } catch (Exception e) {
            log.error("사용자 목표 업데이트 중 오류 발생 - 사용자: {}, 오류: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<UserGoal> createUserGoal(
            @RequestBody UserGoal request,
            HttpServletRequest httpRequest) {
        
        try {
            // JWT에서 사용자 ID 추출하여 권한 확인
            String bearerToken = httpRequest.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                
                log.info("사용자 목표 생성 요청 - 사용자: {}, 데이터: {}", tokenUserId, request);
                
                // 요청 데이터에 사용자 ID 설정
                request.setUserId(tokenUserId);
                
                UserGoal createdGoal = userGoalService.createUserGoal(request);
                return ResponseEntity.ok(createdGoal);
            } else {
                return ResponseEntity.status(401).build();
            }
            
        } catch (Exception e) {
            log.error("사용자 목표 생성 중 오류 발생 - 오류: {}", e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Map<String, Object>> deleteUserGoal(
            @PathVariable Long goalId,
            HttpServletRequest httpRequest) {
        
        try {
            // JWT에서 사용자 ID 추출하여 권한 확인
            String bearerToken = httpRequest.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                
                log.info("사용자 목표 삭제 요청 - 목표 ID: {}, 사용자: {}", goalId, tokenUserId);
                
                // 기존 목표 조회 및 권한 확인
                UserGoal existingGoal = userGoalService.getUserGoalById(goalId);
                if (existingGoal == null) {
                    Map<String, Object> errorResponse = new HashMap<>();
                    errorResponse.put("error", "사용자 목표를 찾을 수 없습니다.");
                    return ResponseEntity.notFound().build();
                }
                
                // 권한 확인: 자신의 목표만 삭제 가능
                if (!existingGoal.getUserId().equals(tokenUserId)) {
                    log.warn("권한 없는 삭제 시도 - 토큰 사용자: {}, 목표 소유자: {}", tokenUserId, existingGoal.getUserId());
                    return ResponseEntity.status(403).build();
                }
                
                // 목표 삭제
                userGoalService.deleteUserGoal(goalId);
                
                // 응답 데이터 구성
                Map<String, Object> response = new HashMap<>();
                response.put("success", true);
                response.put("message", "사용자 목표가 성공적으로 삭제되었습니다.");
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.status(401).build();
            }
            
        } catch (Exception e) {
            log.error("사용자 목표 삭제 중 오류 발생 - 목표 ID: {}, 오류: {}", goalId, e.getMessage(), e);
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "사용자 목표 삭제에 실패했습니다.");
            errorResponse.put("message", e.getMessage());
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/goal/{goalId}")
    public ResponseEntity<UserGoal> getUserGoal(
            @PathVariable Long goalId,
            HttpServletRequest httpRequest) {
        
        try {
            // JWT에서 사용자 ID 추출하여 권한 확인
            String bearerToken = httpRequest.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                
                log.info("사용자 목표 단일 조회 요청 - 목표 ID: {}, 사용자: {}", goalId, tokenUserId);
                
                // 목표 조회
                UserGoal goal = userGoalService.getUserGoalById(goalId);
                if (goal == null) {
                    return ResponseEntity.notFound().build();
                }
                
                // 권한 확인: 자신의 목표만 조회 가능
                if (!goal.getUserId().equals(tokenUserId)) {
                    log.warn("권한 없는 조회 시도 - 토큰 사용자: {}, 목표 소유자: {}", tokenUserId, goal.getUserId());
                    return ResponseEntity.status(403).build();
                }
                
                return ResponseEntity.ok(goal);
            } else {
                return ResponseEntity.status(401).build();
            }
            
        } catch (Exception e) {
            log.error("사용자 목표 단일 조회 중 오류 발생 - 목표 ID: {}, 오류: {}", goalId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }
} 