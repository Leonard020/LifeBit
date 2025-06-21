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
    List<RankingNotification> findByUserUuidOrderByCreatedAtDesc(String userUuid);
    Page<RankingNotification> findByUserUuidOrderByCreatedAtDesc(String userUuid, Pageable pageable);
    Page<RankingNotification> findByUserUuidAndIsReadOrderByCreatedAtDesc(String userUuid, boolean isRead, Pageable pageable);

    /**
     * userUuid 기준 전체 알림 일괄 읽음 처리
     */
    @Modifying
    @Query("UPDATE RankingNotification n SET n.isRead = true WHERE n.userUuid = :userUuid AND n.isRead = false")
    void markAllAsReadByUserUuid(@Param("userUuid") String userUuid);
} 