package com.lifebit.coreapi.exception.ranking;

public class RankingNotificationException extends RankingException {
    public RankingNotificationException(String message) {
        super(message);
    }

    public static RankingNotificationException notificationNotFound(Long notificationId) {
        return new RankingNotificationException(
            String.format("알림을 찾을 수 없습니다. (notificationId: %d)", notificationId));
    }

    public static RankingNotificationException alreadyRead(Long notificationId) {
        return new RankingNotificationException(
            String.format("이미 읽은 알림입니다. (notificationId: %d)", notificationId));
    }

    public static RankingNotificationException invalidNotificationType(String type) {
        return new RankingNotificationException(
            String.format("유효하지 않은 알림 타입입니다. (type: %s)", type));
    }
} 