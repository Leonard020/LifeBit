package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.Notification;
import com.lifebit.coreapi.repository.NotificationRepository;
import com.lifebit.coreapi.dto.NotificationDto;
import com.lifebit.coreapi.entity.NotificationRead;
import com.lifebit.coreapi.repository.NotificationReadRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final NotificationReadRepository notificationReadRepository;

    @PersistenceContext
    private EntityManager entityManager;

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
            return notificationRepository.findByUserIdOrUserIdIsNullAndIsReadOrderByCreatedAtDesc(userId, isRead, pageable);
        } else {
            return notificationRepository.findByUserIdOrUserIdIsNullOrderByCreatedAtDesc(userId, pageable);
        }
    }

    public Page<NotificationDto> getUserNotificationsPageDto(Long userId, Pageable pageable, Boolean isRead) {
        Page<Notification> notifications = getUserNotificationsPage(userId, pageable, isRead);
        return notifications.map(n -> {
            boolean read;
            if (n.getUserId() == null) {
                // 시스템 알림: userId, notificationId 모두 null이 아니고 Long 타입으로 강제
                Long safeUserId = userId;
                Long safeNotificationId = n.getId();
                if (safeUserId == null || safeNotificationId == null) {
                    read = false;
                    System.out.println("[DEBUG] SYSTEM 알림 id=" + safeNotificationId + ", userId=" + safeUserId + " (null 체크 실패), isRead=false");
                } else {
                    read = notificationReadRepository.existsByUserIdAndNotificationId(safeUserId, safeNotificationId);
                    System.out.println("[DEBUG] SYSTEM 알림 id=" + safeNotificationId + ", userId=" + safeUserId + ", isRead=" + read);
                }
            } else {
                read = n.isRead();
            }
            return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .refId(n.getRefId())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(read)
                .createdAt(n.getCreatedAt())
                .build();
        });
    }

    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다. (ID: " + notificationId + ")"));
        boolean isSystem = notification.getUserId() == null;
        System.out.println("[DEBUG] markAsRead: notificationId=" + notificationId + ", userId=" + userId + ", isSystem=" + isSystem);
        if (!notificationReadRepository.existsByUserIdAndNotificationId(userId, notificationId)) {
            NotificationRead read = new NotificationRead();
            read.setUserId(userId);
            read.setNotificationId(notificationId);
            notificationReadRepository.save(read);
            entityManager.flush();
            entityManager.clear();
            System.out.println("[DEBUG] markAsRead: notification_read INSERT (userId=" + userId + ", notificationId=" + notificationId + ")");
        } else {
            System.out.println("[DEBUG] markAsRead: notification_read ALREADY EXISTS (userId=" + userId + ", notificationId=" + notificationId + ")");
        }
        if (!isSystem && notification.getUserId().equals(userId)) {
            notification.setRead(true);
            notificationRepository.saveAndFlush(notification);
            entityManager.clear();
            System.out.println("[DEBUG] markAsRead: 개인 알림 is_read=true UPDATE (notificationId=" + notificationId + ")");
        }
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        // 개인 알림 일괄 처리
        notificationRepository.markAllAsReadByUserId(userId);

        // 시스템 알림 일괄 처리 (batch insert)
        List<Notification> systemNotifications = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        List<NotificationRead> toInsert = new ArrayList<>();
        for (Notification n : systemNotifications) {
            if (!notificationReadRepository.existsByUserIdAndNotificationId(userId, n.getId())) {
                NotificationRead read = new NotificationRead();
                read.setUserId(userId);
                read.setNotificationId(n.getId());
                toInsert.add(read);
            }
        }
        if (!toInsert.isEmpty()) {
            notificationReadRepository.saveAll(toInsert);
        }
    }

    @Transactional
    public void deleteNotification(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new RuntimeException("알림을 찾을 수 없습니다. (ID: " + notificationId + ")"));
        // 시스템 알림도 삭제 허용
        if (notification.getUserId() != null && !notification.getUserId().equals(userId)) {
            throw new RuntimeException("해당 알림을 삭제할 권한이 없습니다. (사용자 ID: " + userId + ", 알림 소유자 ID: " + notification.getUserId() + ")");
        }
        notificationRepository.deleteById(notificationId);
    }

    public long getUnreadCount(Long userId) {
        // 개인 알림: isRead = false
        long personalUnread = notificationRepository.countUnreadByUserIdOrUserIdIsNull(userId) - countUnreadSystemNotifications(userId);
        // 시스템 알림: notification_read에 없는 것만 카운트
        long systemUnread = countUnreadSystemNotifications(userId);
        return personalUnread + systemUnread;
    }

    private long countUnreadSystemNotifications(Long userId) {
        List<Notification> systemNotifications = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        long count = 0;
        for (Notification n : systemNotifications) {
            if (!notificationReadRepository.existsByUserIdAndNotificationId(userId, n.getId())) {
                count++;
            }
        }
        return count;
    }
} 