package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.BodyPartType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExerciseCatalogRepository extends JpaRepository<ExerciseCatalog, Long> {
    Optional<ExerciseCatalog> findByUuid(UUID uuid);
    List<ExerciseCatalog> findByBodyPart(BodyPartType bodyPart);
    List<ExerciseCatalog> findByNameContainingIgnoreCase(String name);

    Optional<ExerciseCatalog> findByName(String name);
}