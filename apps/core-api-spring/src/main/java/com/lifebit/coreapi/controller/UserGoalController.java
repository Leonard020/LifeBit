package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.UserGoal;
import com.lifebit.coreapi.service.UserGoalService;
import com.lifebit.coreapi.security.JwtTokenProvider;
import com.lifebit.coreapi.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/user-goals")
@RequiredArgsConstructor
@Slf4j
public class UserGoalController {
    private final UserGoalService userGoalService;
    private final JwtTokenProvider jwtTokenProvider;
    private final RankingService rankingService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserGoal> getUserGoals(
            @PathVariable Long userId,
            HttpServletRequest request) {
        try {
            String bearerToken = request.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
                if (!tokenUserId.equals(userId)) {
                    return ResponseEntity.status(403).build();
                }
                // ✅ 목표가 없으면 기본값을 반환하도록 수정
                UserGoal userGoal = userGoalService.getLatestUserGoal(userId);
                if (userGoal == null) {
                    // 목표가 없으면 기본값으로 설정된 목표를 반환 (DB에 저장하지 않음)
                    userGoal = userGoalService.getUserGoalOrDefault(userId);
                }
                return ResponseEntity.ok(userGoal);
            } else {
                return ResponseEntity.status(401).build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
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
            String bearerToken = httpRequest.getHeader("Authorization");
            if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
                String token = bearerToken.substring(7);
                Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);

                // 요청 데이터에 사용자 ID 설정
                request.setUserId(tokenUserId);

                // 1. Get latest goal
                UserGoal latestGoal = userGoalService.getLatestUserGoal(tokenUserId);

                // 2. If same, return latest (do not insert)
                if (userGoalService.isSameGoal(request, latestGoal)) {
                    return ResponseEntity.ok(latestGoal);
                }

                // 3. Else, insert new
                UserGoal createdGoal = userGoalService.createUserGoal(request);
                return ResponseEntity.ok(createdGoal);
            } else {
                return ResponseEntity.status(401).build();
            }
        } catch (Exception e) {
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

    /**
     * 목표 달성률에 따른 랭킹 점수 업데이트
     */
    @PostMapping("/update-achievement-score")
    public ResponseEntity<Map<String, Object>> updateAchievementScore(
            @RequestHeader("Authorization") String tokenHeader) {
        try {
            String token = tokenHeader != null && tokenHeader.startsWith("Bearer ")
                    ? tokenHeader.substring(7)
                    : tokenHeader;
            Long userId = jwtTokenProvider.getUserIdFromToken(token);
            
            // 목표 달성률에 따른 점수 업데이트
            rankingService.updateGoalAchievementScore(userId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "목표 달성률 점수가 업데이트되었습니다.");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("목표 달성률 점수 업데이트 실패: {}", e.getMessage());
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "점수 업데이트 중 오류가 발생했습니다.");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
} 