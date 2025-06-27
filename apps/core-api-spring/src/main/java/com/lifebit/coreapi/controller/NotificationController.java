package com.lifebit.coreapi.controller;

import com.lifebit.coreapi.entity.Notification;
import com.lifebit.coreapi.service.NotificationService;
import com.lifebit.coreapi.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;

    /**
     * 알림 목록 조회 (페이징/필터링)
     */
    @GetMapping
    public ResponseEntity<Page<NotificationDto>> getMyNotifications(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean isRead
    ) {
        Long userId = Long.parseLong(userDetails.getUsername());
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(notificationService.getUserNotificationsPageDto(userId, pageable, isRead));
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

    /**
     * 알림 읽음 처리
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        Long userId = Long.parseLong(userDetails.getUsername());
        try {
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "알림 읽음 처리 실패",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 알림 삭제
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@AuthenticationPrincipal UserDetails userDetails, @PathVariable Long id) {
        Long userId = Long.parseLong(userDetails.getUsername());
        try {
            notificationService.deleteNotification(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "알림 삭제 실패",
                "message", e.getMessage()
            ));
        }
    }

    /**
     * 읽지 않은 알림 개수 반환
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@AuthenticationPrincipal UserDetails userDetails) {
        Long userId = Long.parseLong(userDetails.getUsername());
        long count = notificationService.getUnreadCount(userId);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
} 