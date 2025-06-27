package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.NotificationRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface NotificationReadRepository extends JpaRepository<NotificationRead, Long> {
    Optional<NotificationRead> findByUserIdAndNotificationId(Long userId, Long notificationId);
    @Query("SELECT COUNT(nr) > 0 FROM NotificationRead nr WHERE nr.userId = :userId AND nr.notificationId = :notificationId")
    boolean existsByUserIdAndNotificationId(@Param("userId") Long userId, @Param("notificationId") Long notificationId);

} 