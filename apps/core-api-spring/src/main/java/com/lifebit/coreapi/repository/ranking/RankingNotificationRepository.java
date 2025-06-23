package com.lifebit.coreapi.repository.ranking;

import com.lifebit.coreapi.entity.ranking.RankingNotification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RankingNotificationRepository extends JpaRepository<RankingNotification, Long> {
    @org.springframework.data.jpa.repository.Query("SELECT n FROM RankingNotification n WHERE n.userId = :userId ORDER BY n.createdAt DESC")
    java.util.List<RankingNotification> findByUserIdOrderByCreatedAtDesc(@org.springframework.data.repository.query.Param("userId") Long userId);
    Page<RankingNotification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Page<RankingNotification> findByUserIdAndIsReadOrderByCreatedAtDesc(Long userId, boolean isRead, Pageable pageable);

    /**
     * userId 기준 전체 알림 일괄 읽음 처리
     */
    @Modifying
    @Query("UPDATE RankingNotification n SET n.isRead = true WHERE n.userId = :userId AND n.isRead = false")
    void markAllAsReadByUserId(@Param("userId") Long userId);
} 