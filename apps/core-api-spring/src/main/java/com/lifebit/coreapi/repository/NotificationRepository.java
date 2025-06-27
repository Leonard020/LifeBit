package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByCreatedAtDesc(Long userId);
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<Notification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead, Pageable pageable);

    // 시스템 공용 알림을 포함한 조회 메서드
    @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId IS NULL) ORDER BY n.createdAt DESC")
    Page<Notification> findByUserIdOrUserIdIsNullOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT n FROM Notification n WHERE (n.userId = :userId OR n.userId IS NULL) AND n.isRead = :isRead ORDER BY n.createdAt DESC")
    Page<Notification> findByUserIdOrUserIdIsNullAndIsReadOrderByCreatedAtDesc(@Param("userId") Long userId, @Param("isRead") boolean isRead, Pageable pageable);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(n) FROM Notification n WHERE (n.userId = :userId OR n.userId IS NULL) AND n.isRead = false")
    long countUnreadByUserIdOrUserIdIsNull(@Param("userId") Long userId);

    // 시스템 공용 알림만 조회
    @Query("SELECT n FROM Notification n WHERE n.userId IS NULL ORDER BY n.createdAt DESC")
    List<Notification> findByUserIdIsNullOrderByCreatedAtDesc();
} 