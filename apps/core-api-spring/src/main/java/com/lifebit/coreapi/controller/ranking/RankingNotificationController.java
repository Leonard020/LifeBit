package com.lifebit.coreapi.controller.ranking;

import com.lifebit.coreapi.entity.ranking.RankingNotification;
import com.lifebit.coreapi.service.ranking.RankingNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.lifebit.coreapi.dto.ranking.RankingNotificationDto;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/ranking-notifications")
@RequiredArgsConstructor
@Slf4j
public class RankingNotificationController {
    private final RankingNotificationService notificationService;

    /**
     * 알림 목록 조회 (페이징/필터링/DTO)
     */
    @GetMapping
    public ResponseEntity<Page<RankingNotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean isRead
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(notificationService.getUserNotificationsDto(userId, pageable, isRead));
    }

    /**
     * 알림 전체 읽음 처리
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("[알림 읽음 처리] userId: {}, notificationId: {}", userId, id);
        try {
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("[알림 읽음 처리 오류] userId: {}, notificationId: {}, error: {}", userId, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "알림 읽음 처리 실패",
                "message", e.getMessage()
            ));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        Long userId = Long.parseLong(userDetails.getUsername());
        log.info("[알림 삭제] userId: {}, notificationId: {}", userId, id);
        try {
            notificationService.deleteNotification(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("[알림 삭제 오류] userId: {}, notificationId: {}, error: {}", userId, id, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "알림 삭제 실패",
                "message", e.getMessage()
            ));
        }
    }
} 