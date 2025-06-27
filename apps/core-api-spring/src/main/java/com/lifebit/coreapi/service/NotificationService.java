package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.Notification;
import com.lifebit.coreapi.repository.NotificationRepository;
import com.lifebit.coreapi.dto.NotificationDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;

    public void saveNotification(Long userId, String type, String title, String message) {
        saveNotification(userId, type, title, message, null);
    }

    public void saveNotification(Long userId, String type, String title, String message, Long refId) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setType(type);
        notification.setRefId(refId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(LocalDateTime.now());
        notificationRepository.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public Page<Notification> getUserNotificationsPage(Long userId, Pageable pageable, Boolean isRead) {
        if (isRead != null) {
            return notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, isRead, pageable);
        } else {
            return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
    }

    public Page<NotificationDto> getUserNotificationsPageDto(Long userId, Pageable pageable, Boolean isRead) {
        Page<Notification> notifications = getUserNotificationsPage(userId, pageable, isRead);
        return notifications.map(n -> NotificationDto.builder()
            .id(n.getId())
            .type(n.getType())
            .refId(n.getRefId())
            .title(n.getTitle())
            .message(n.getMessage())
            .isRead(n.isRead())
            .createdAt(n.getCreatedAt())
            .build()
        );
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다."));
        if (!notification.getUserId().equals(userId)) {
            throw new RuntimeException("권한이 없습니다.");
        }
        notificationRepository.deleteById(notificationId);
    }
} 