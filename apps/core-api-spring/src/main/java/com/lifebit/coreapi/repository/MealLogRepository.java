package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.MealLog;
import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MealLogRepository extends JpaRepository<MealLog, Long> {
    Optional<MealLog> findByUuid(UUID uuid);
    List<MealLog> findByUserOrderByLogDateDesc(User user);
    List<MealLog> findByUserAndLogDateBetweenOrderByLogDateDesc(
        User user, LocalDate startDate, LocalDate endDate);
} 