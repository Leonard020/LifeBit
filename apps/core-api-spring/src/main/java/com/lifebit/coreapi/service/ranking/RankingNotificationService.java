package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.dto.ranking.RankingNotificationResponse;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingNotFoundException;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.validator.ranking.RankingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RankingNotificationService {
    private final UserRankingRepository userRankingRepository;
    private final RankingValidator rankingValidator;

    @Transactional(readOnly = true)
    public List<RankingNotificationResponse> getUserNotifications(String userUuid) {
        UserRanking ranking = findAndValidateRanking(userUuid);
        List<RankingNotificationResponse> notifications = new ArrayList<>();

        // 랭킹 변동 알림
        if (ranking.getRankChange() != null && ranking.getRankChange() != 0) {
            notifications.add(createRankChangeNotification(ranking));
        }

        // 연속 기록 알림
        if (ranking.getStreakDays() > 0) {
            notifications.add(createStreakNotification(ranking));
        }

        return notifications;
    }

    private RankingNotificationResponse createRankChangeNotification(UserRanking ranking) {
        return RankingNotificationResponse.builder()
                .userUuid(ranking.getUserUuid())
                .title("랭킹 변동 알림")
                .message(String.format("랭킹이 %d위 %s했습니다.", 
                    Math.abs(ranking.getRankChange()),
                    ranking.getRankChange() > 0 ? "하락" : "상승"))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
    }

    private RankingNotificationResponse createStreakNotification(UserRanking ranking) {
        return RankingNotificationResponse.builder()
                .userUuid(ranking.getUserUuid())
                .title("연속 기록 알림")
                .message(String.format("%d일 연속으로 기록을 달성했습니다!", ranking.getStreakDays()))
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
    }

    private UserRanking findAndValidateRanking(String userUuid) {
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return ranking;
    }

    @Transactional
    public void sendRankingChangeNotification(String userUuid, int oldRank, int newRank) {
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);

        String message = String.format("랭킹이 %d위에서 %d위로 변경되었습니다.", oldRank, newRank);
        createNotification(userUuid, "랭킹 변경 알림", message);
    }

    @Transactional
    public void sendPeriodEndNotification(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsByPeriodType(periodType, 3);
        
        for (UserRanking ranking : topRankings) {
            String message = String.format("%s 랭킹이 종료되었습니다. 최종 순위: %d위", 
                periodType.name(), ranking.getPeriodRank());
            createNotification(ranking.getUserUuid(), "랭킹 종료 알림", message);
        }
    }

    @Transactional
    public void sendSeasonEndNotification(String season) {
        rankingValidator.validateSeason(season);
        List<UserRanking> topRankings = userRankingRepository.findTopRankingsBySeason(season, 3);
        
        for (UserRanking ranking : topRankings) {
            String message = String.format("%s 시즌이 종료되었습니다. 최종 순위: %d위", 
                season, ranking.getSeasonRank());
            createNotification(ranking.getUserUuid(), "시즌 종료 알림", message);
        }
    }

    @Transactional
    public void sendRewardNotification(String userUuid, String rewardTitle, Integer points) {
        RankingNotificationResponse notification = createNotification(
            userUuid,
            "보상 획득",
            String.format("'%s' 보상을 획득했습니다! (+%d 포인트)", rewardTitle, points)
        );
        // TODO: 알림 저장 로직 구현
    }

    @Transactional
    public void sendAchievementNotification(String userUuid, String achievementTitle) {
        RankingNotificationResponse notification = createNotification(
            userUuid,
            "업적 달성",
            String.format("'%s' 업적을 달성했습니다!", achievementTitle)
        );
        // TODO: 알림 저장 로직 구현
    }

    private RankingNotificationResponse createNotification(String userUuid, String title, String message) {
        return RankingNotificationResponse.builder()
                .userUuid(userUuid)
                .title(title)
                .message(message)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
    }
} 