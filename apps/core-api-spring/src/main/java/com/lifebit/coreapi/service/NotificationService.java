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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

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
        // 새로운 쿼리 사용: 시스템 알림 + 개인 알림 + 읽음 여부
        Page<Object[]> results = notificationRepository.findAllNotificationsWithReadStatus(userId, pageable);
        return results.map(obj -> {
            Notification n = (Notification) obj[0];
            boolean read = (Boolean) obj[1];
            return NotificationDto.builder()
                .id(n.getId())
                .type(n.getType())
                .refId(n.getRefId())
                .title(n.getTitle())
                .message(n.getMessage())
                .isRead(read)
                .createdAt(n.getCreatedAt())
                .userId(n.getUserId())
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
        System.out.println("[DEBUG] markAllAsRead 시작: userId=" + userId);
        
        // 개인 알림 일괄 처리
        notificationRepository.markAllAsReadByUserId(userId);
        System.out.println("[DEBUG] markAllAsRead: 개인 알림 일괄 업데이트 완료");

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
            System.out.println("[DEBUG] markAllAsRead: 시스템 알림 " + toInsert.size() + "개 읽음 처리");
        } else {
            System.out.println("[DEBUG] markAllAsRead: 이미 모든 시스템 알림을 읽음 처리함");
        }
        
        // 처리 후 상태 확인
        System.out.println("[DEBUG] markAllAsRead: 처리 후 상태 확인");
        for (Notification n : systemNotifications) {
            boolean exists = notificationReadRepository.existsByUserIdAndNotificationId(userId, n.getId());
            System.out.println("[DEBUG] 알림 ID " + n.getId() + " 읽음 상태: " + exists);
        }
        
        System.out.println("[DEBUG] markAllAsRead 완료: userId=" + userId);
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
        System.out.println("[DEBUG] getUnreadCount 시작: userId=" + userId);
        
        // 개인 알림: isRead = false
        long personalUnread = notificationRepository.countUnreadByUserIdOrUserIdIsNull(userId) - countUnreadSystemNotifications(userId);
        // 시스템 알림: notification_read에 없는 것만 카운트
        long systemUnread = countUnreadSystemNotifications(userId);
        long totalUnread = personalUnread + systemUnread;
        
        System.out.println("[DEBUG] getUnreadCount 결과: personalUnread=" + personalUnread + ", systemUnread=" + systemUnread + ", totalUnread=" + totalUnread);
        
        return totalUnread;
    }

    private long countUnreadSystemNotifications(Long userId) {
        System.out.println("[DEBUG] countUnreadSystemNotifications 시작: userId=" + userId);
        
        List<Notification> systemNotifications = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        long count = 0;
        
        for (Notification n : systemNotifications) {
            boolean exists = notificationReadRepository.existsByUserIdAndNotificationId(userId, n.getId());
            if (!exists) {
                count++;
                System.out.println("[DEBUG] 읽지 않은 시스템 알림: id=" + n.getId());
            } else {
                System.out.println("[DEBUG] 읽은 시스템 알림: id=" + n.getId());
            }
        }
        
        System.out.println("[DEBUG] countUnreadSystemNotifications 결과: " + count);
        return count;
    }

    /**
     * 회원가입 시 기존 시스템 알림(Notification.userId == null)에 대해 NotificationRead(userId, notificationId)를 생성
     */
    @Transactional
    public void markAllSystemNotificationsAsUnreadForUser(Long userId) {
        List<Notification> systemNotifications = notificationRepository.findByUserIdIsNullOrderByCreatedAtDesc();
        log.info("시스템 알림 개수: {}", systemNotifications.size());
        List<NotificationRead> toInsert = new ArrayList<>();
        for (Notification n : systemNotifications) {
            if (!notificationReadRepository.existsByUserIdAndNotificationId(userId, n.getId())) {
                NotificationRead read = new NotificationRead();
                read.setUserId(userId);
                read.setNotificationId(n.getId());
                toInsert.add(read);
            }
        }
        log.info("NotificationRead 생성 개수: {}", toInsert.size());
        if (!toInsert.isEmpty()) {
            notificationReadRepository.saveAll(toInsert);
        }
    }
} 