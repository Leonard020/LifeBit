package com.lifebit.coreapi.controller.ranking;

import com.lifebit.coreapi.entity.ranking.RankingNotification;
import com.lifebit.coreapi.service.ranking.RankingNotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.lifebit.coreapi.dto.ranking.RankingNotificationDto;
import com.lifebit.coreapi.entity.User;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;

@RestController
@RequestMapping("/api/v1/ranking-notifications")
@RequiredArgsConstructor
public class RankingNotificationController {
    private final RankingNotificationService notificationService;

    /**
     * 알림 목록 조회 (페이징/필터링/DTO)
     */
    @GetMapping
    public ResponseEntity<Page<RankingNotificationDto>> getMyNotifications(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Boolean isRead
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(notificationService.getUserNotificationsDto(user.getUserId(), pageable, isRead));
    }

    /**
     * 알림 전체 읽음 처리
     */
    @PostMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(@AuthenticationPrincipal User user) {
        notificationService.markAllAsRead(user.getUserId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.markAsRead(id, user.getUserId());
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@AuthenticationPrincipal User user, @PathVariable Long id) {
        notificationService.deleteNotification(id, user.getUserId());
        return ResponseEntity.ok().build();
    }
} 