package com.lifebit.coreapi.repository;

import com.lifebit.coreapi.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByNickname(String nickname);

    @Query(value = """
        INSERT INTO users (email, nickname, password_hash, role, uuid, created_at, updated_at)
        VALUES (:email, :nickname, :passwordHash, CAST(:role AS user_role), :uuid, :createdAt, :updatedAt)
        RETURNING *
        """, nativeQuery = true)
    User saveWithRole(
        @Param("email") String email,
        @Param("nickname") String nickname,
        @Param("passwordHash") String passwordHash,
        @Param("role") String role,
        @Param("uuid") UUID uuid,
        @Param("createdAt") LocalDateTime createdAt,
        @Param("updatedAt") LocalDateTime updatedAt
    );
} 