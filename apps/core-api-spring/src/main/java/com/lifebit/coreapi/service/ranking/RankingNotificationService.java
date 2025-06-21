package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingNotificationRepository;
import com.lifebit.coreapi.validator.ranking.RankingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import com.lifebit.coreapi.entity.ranking.RankingNotification;
import com.lifebit.coreapi.dto.ranking.RankingNotificationResponse;

@Service
@RequiredArgsConstructor
public class RankingNotificationService {
    private final UserRankingRepository userRankingRepository;
    private final RankingValidator rankingValidator;
    private final RankingNotificationRepository rankingNotificationRepository;

    /**
     * 랭킹 알림 저장 (타입 필수)
     */
    public void saveNotification(String userUuid, RankingNotification.NotificationType type, String title, String message) {
        RankingNotification notification = new RankingNotification();
        notification.setUserUuid(userUuid);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }

    /**
     * 사용자 알림 목록 조회
     */
    public List<RankingNotification> getUserNotifications(String userUuid) {
        return rankingNotificationRepository.findByUserUuidOrderByCreatedAtDesc(userUuid);
    }

    /**
     * 사용자 알림 목록 조회 (DTO 변환, 페이징/필터링 지원)
     */
    public Page<RankingNotificationResponse> getUserNotificationsDto(String userUuid, Pageable pageable, Boolean isRead) {
        Page<RankingNotification> notifications;
        if (isRead != null) {
            notifications = rankingNotificationRepository.findByUserUuidAndIsReadOrderByCreatedAtDesc(userUuid, isRead, pageable);
        } else {
            notifications = rankingNotificationRepository.findByUserUuidOrderByCreatedAtDesc(userUuid, pageable);
        }
        return notifications.map(n -> RankingNotificationResponse.builder()
            .id(n.getId())
            .title(n.getTitle())
            .message(n.getMessage())
            .isRead(n.isRead())
            .createdAt(n.getCreatedAt())
            .build());
    }

    /**
     * 알림 읽음 처리 (권한 체크 포함)
     */
    public void markAsRead(Long notificationId, String userUuid) {
        RankingNotification notification = rankingNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new com.lifebit.coreapi.exception.ranking.RankingNotificationException("알림을 찾을 수 없습니다."));
        if (!notification.getUserUuid().equals(userUuid)) {
            throw new com.lifebit.coreapi.exception.ranking.RankingNotificationException("권한이 없습니다.");
        }
        if (notification.isRead()) {
            throw com.lifebit.coreapi.exception.ranking.RankingNotificationException.alreadyRead(notificationId);
        }
        notification.setRead(true);
        rankingNotificationRepository.save(notification);
    }

    /**
     * 알림 삭제 (권한 체크 포함)
     */
    public void deleteNotification(Long notificationId, String userUuid) {
        RankingNotification notification = rankingNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new com.lifebit.coreapi.exception.ranking.RankingNotificationException("알림을 찾을 수 없습니다."));
        if (!notification.getUserUuid().equals(userUuid)) {
            throw new com.lifebit.coreapi.exception.ranking.RankingNotificationException("권한이 없습니다.");
        }
        rankingNotificationRepository.deleteById(notificationId);
    }

    /**
     * 전체 알림 일괄 읽음 처리
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void markAllAsRead(String userUuid) {
        rankingNotificationRepository.markAllAsReadByUserUuid(userUuid);
    }

    @Transactional
    public void sendRankingChangeNotification(String userUuid, int oldRank, int newRank) {
        String message = String.format("랭킹이 %d위에서 %d위로 변경되었습니다.", oldRank, newRank);
        RankingNotification notification = new RankingNotification();
        notification.setUserUuid(userUuid);
        notification.setType(RankingNotification.NotificationType.RANK_CHANGE);
        notification.setTitle("랭킹 변경 알림");
        notification.setMessage(message);
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }

    @Transactional
    public void sendPeriodEndNotification(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsByPeriodType(periodType, org.springframework.data.domain.PageRequest.of(0, 3));
        for (UserRanking ranking : topRankings) {
            String message = String.format("%s 랭킹이 종료되었습니다. 최종 순위: %d위", periodType.name(), ranking.getPeriodRank());
            saveNotification(ranking.getUserUuid(), RankingNotification.NotificationType.PERIOD_END, "랭킹 종료 알림", message);
        }
    }

    @Transactional
    public void sendSeasonEndNotification(String season) {
        rankingValidator.validateSeason(season);
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsBySeason(season, org.springframework.data.domain.PageRequest.of(0, 3));
        for (UserRanking ranking : topRankings) {
            String message = String.format("%s 시즌이 종료되었습니다. 최종 순위: %d위", season, ranking.getSeasonRank());
            saveNotification(ranking.getUserUuid(), RankingNotification.NotificationType.SEASON_END, "시즌 종료 알림", message);
        }
    }

    @Transactional
    public void sendRewardNotification(String userUuid, String rewardTitle, Integer points) {
        RankingNotification notification = new RankingNotification();
        notification.setUserUuid(userUuid);
        notification.setType(RankingNotification.NotificationType.REWARD);
        notification.setTitle("보상 획득");
        notification.setMessage(String.format("'%s' 보상을 획득했습니다! (+%d 포인트)", rewardTitle, points));
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }

    @Transactional
    public void sendAchievementNotification(String userUuid, String achievementTitle) {
        RankingNotification notification = new RankingNotification();
        notification.setUserUuid(userUuid);
        notification.setType(RankingNotification.NotificationType.ACHIEVEMENT);
        notification.setTitle("업적 달성");
        notification.setMessage(String.format("'%s' 업적을 달성했습니다!", achievementTitle));
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }
} 