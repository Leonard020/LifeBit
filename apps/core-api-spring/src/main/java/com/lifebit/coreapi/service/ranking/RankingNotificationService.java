package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingNotificationRepository;
import com.lifebit.coreapi.repository.ranking.RankingHistoryRepository;
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
import com.lifebit.coreapi.dto.ranking.RankingNotificationDto;
import com.lifebit.coreapi.service.UserService;
import com.lifebit.coreapi.entity.enums.RankingTier;

@Service
@RequiredArgsConstructor
public class RankingNotificationService {
    private final UserRankingRepository userRankingRepository;
    private final RankingValidator rankingValidator;
    private final RankingNotificationRepository rankingNotificationRepository;
    private final UserService userService;
    private final RankingHistoryRepository rankingHistoryRepository;

    /**
     * 랭킹 알림 저장 (타입 필수)
     */
    public void saveNotification(Long userId, RankingNotification.NotificationType type, String title, String message) {
        RankingNotification notification = new RankingNotification();
        notification.setUserId(userId);
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
    public List<RankingNotification> getUserNotifications(Long userId) {
        return rankingNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * 사용자 알림 목록 조회 (DTO 변환, 페이징/필터링 지원)
     */
    public Page<RankingNotificationDto> getUserNotificationsDto(Long userId, Pageable pageable, Boolean isRead) {
        Page<RankingNotification> notifications;
        if (isRead != null) {
            notifications = rankingNotificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(userId, isRead, pageable);
        } else {
            notifications = rankingNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }
        return notifications.map(n -> RankingNotificationDto.builder()
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
    public void markAsRead(Long notificationId, Long userId) {
        RankingNotification notification = rankingNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new com.lifebit.coreapi.exception.ranking.RankingNotificationException("알림을 찾을 수 없습니다."));
        if (!notification.getUserId().equals(userId)) {
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
    public void deleteNotification(Long notificationId, Long userId) {
        RankingNotification notification = rankingNotificationRepository.findById(notificationId)
            .orElseThrow(() -> new com.lifebit.coreapi.exception.ranking.RankingNotificationException("알림을 찾을 수 없습니다."));
        if (!notification.getUserId().equals(userId)) {
            throw new com.lifebit.coreapi.exception.ranking.RankingNotificationException("권한이 없습니다.");
        }
        rankingNotificationRepository.deleteById(notificationId);
    }

    /**
     * 전체 알림 일괄 읽음 처리
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void markAllAsRead(Long userId) {
        rankingNotificationRepository.markAllAsReadByUserId(userId);
    }

    @Transactional
    public void sendRankingChangeNotification(Long userId, int oldRank, int newRank) {
        String message = String.format("랭킹이 %d위에서 %d위로 변경되었습니다.", oldRank, newRank);
        RankingNotification notification = new RankingNotification();
        notification.setUserId(userId);
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
        java.util.List<com.lifebit.coreapi.entity.RankingHistory> histories = rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType.name(), org.springframework.data.domain.PageRequest.of(0, 3)).getContent();
        for (com.lifebit.coreapi.entity.RankingHistory history : histories) {
            UserRanking ranking = history.getUserRanking();
            String message = String.format("%s 랭킹이 종료되었습니다. 최종 순위: %d위", periodType.name(), history.getRankPosition());
            saveNotification(ranking.getUserId(), RankingNotification.NotificationType.PERIOD_END, "랭킹 종료 알림", message);
        }
    }

    @Transactional
    public void sendSeasonEndNotification(String season) {
        rankingValidator.validateSeason(season);
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsBySeason(season, org.springframework.data.domain.PageRequest.of(0, 3));
        for (UserRanking ranking : topRankings) {
            String message = String.format("%s 시즌이 종료되었습니다. 최종 순위: %d위", season, ranking.getRankPosition());
            saveNotification(ranking.getUserId(), RankingNotification.NotificationType.SEASON_END, "시즌 종료 알림", message);
        }
    }

    @Transactional
    public void sendRewardNotification(Long userId, String rewardTitle, Integer points) {
        RankingNotification notification = new RankingNotification();
        notification.setUserId(userId);
        notification.setType(RankingNotification.NotificationType.REWARD);
        notification.setTitle("보상 획득");
        notification.setMessage(String.format("'%s' 보상을 획득했습니다! (+%d 포인트)", rewardTitle, points));
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }

    @Transactional
    public void sendAchievementNotification(Long userId, String achievementTitle) {
        RankingNotification notification = new RankingNotification();
        notification.setUserId(userId);
        notification.setType(RankingNotification.NotificationType.ACHIEVEMENT);
        notification.setTitle("업적 달성");
        notification.setMessage(String.format("'%s' 업적을 달성했습니다!", achievementTitle));
        notification.setRead(false);
        notification.setCreatedAt(java.time.LocalDateTime.now());
        rankingNotificationRepository.save(notification);
    }

    /**
     * 등급 변화 알림 전송
     */
    @Transactional
    public void sendTierChangeNotification(Long userId, RankingTier prevTier, RankingTier newTier) {
        String message = String.format("등급이 %s에서 %s로 변경되었습니다.", prevTier.name(), newTier.name());
        saveNotification(userId, RankingNotification.NotificationType.RANK_CHANGE, "등급 변화 알림", message);
    }

    /**
     * 업적 달성 알림 전송 (AchievementService에서 호출)
     */
    @Transactional
    public void notifyAchievementUnlocked(Long userId, com.lifebit.coreapi.entity.Achievement achievement) {
        try {
            RankingNotification notification = new RankingNotification();
            notification.setUserId(userId);
            notification.setType(RankingNotification.NotificationType.ACHIEVEMENT);
            notification.setTitle("업적 달성");
            notification.setMessage(String.format("'%s' 업적을 달성했습니다! 🎉", achievement.getTitle()));
            notification.setRead(false);
            notification.setCreatedAt(java.time.LocalDateTime.now());
            rankingNotificationRepository.save(notification);
        } catch (Exception e) {
            // 알림 전송 실패 시 로그만 남기고 계속 진행
            System.err.println("Failed to send achievement notification: " + e.getMessage());
        }
    }
} 