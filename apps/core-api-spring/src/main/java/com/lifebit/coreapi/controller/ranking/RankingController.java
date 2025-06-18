package com.lifebit.coreapi.controller.ranking;

import com.lifebit.coreapi.dto.ranking.*;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.service.ranking.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingController {
    private final RankingService rankingService;
    private final RankingRewardService rankingRewardService;
    private final RankingNotificationService rankingNotificationService;

    @GetMapping("/me")
    public ResponseEntity<RankingResponse> getMyRanking() {
        return ResponseEntity.ok(rankingService.getMyRanking());
    }

    @GetMapping("/me/season")
    public ResponseEntity<SeasonRankingResponse> getMySeasonRanking() {
        return ResponseEntity.ok(rankingService.getMySeasonRanking());
    }

    @GetMapping("/me/period")
    public ResponseEntity<PeriodRankingResponse> getMyPeriodRanking(
            @RequestParam PeriodType periodType) {
        return ResponseEntity.ok(rankingService.getMyPeriodRanking(periodType));
    }

    @GetMapping("/top")
    public ResponseEntity<Page<RankingResponse>> getTopRankings(Pageable pageable) {
        return ResponseEntity.ok(rankingService.getTopRankings(pageable));
    }

    @GetMapping("/top/season")
    public ResponseEntity<Page<SeasonRankingResponse>> getTopSeasonRankings(
            @RequestParam String season,
            Pageable pageable) {
        return ResponseEntity.ok(rankingService.getTopSeasonRankings(season, pageable));
    }

    @GetMapping("/top/period")
    public ResponseEntity<Page<PeriodRankingResponse>> getTopPeriodRankings(
            @RequestParam PeriodType periodType,
            Pageable pageable) {
        return ResponseEntity.ok(rankingService.getTopPeriodRankings(periodType, pageable));
    }

    @GetMapping("/stats")
    public ResponseEntity<RankingStatsResponse> getRankingStats() {
        return ResponseEntity.ok(rankingService.getRankingStats());
    }

    @GetMapping("/history")
    public ResponseEntity<Page<RankingHistoryResponse>> getRankingHistory(
            @RequestParam(required = false) PeriodType periodType,
            @RequestParam(required = false) String season,
            Pageable pageable) {
        return ResponseEntity.ok(rankingService.getRankingHistory(periodType, season, pageable));
    }

    @GetMapping("/rewards/season")
    public ResponseEntity<List<RankingRewardResponse>> getSeasonRewards(
            @RequestParam String season) {
        return ResponseEntity.ok(rankingRewardService.getSeasonRewards(season));
    }

    @GetMapping("/rewards/period")
    public ResponseEntity<List<RankingRewardResponse>> getPeriodRewards(
            @RequestParam PeriodType periodType) {
        return ResponseEntity.ok(rankingRewardService.getPeriodRewards(periodType));
    }

    @GetMapping("/rewards/streak")
    public ResponseEntity<List<RankingRewardResponse>> getStreakRewards() {
        return ResponseEntity.ok(rankingRewardService.getStreakRewards());
    }

    @GetMapping("/rewards/me")
    public ResponseEntity<RankingRewardResponse> getMyReward() {
        return ResponseEntity.ok(rankingRewardService.getMyReward(getCurrentUserUuid()));
    }

    @GetMapping("/notifications")
    public ResponseEntity<List<RankingNotificationResponse>> getNotifications() {
        return ResponseEntity.ok(rankingNotificationService.getUserNotifications(getCurrentUserUuid()));
    }

    private String getCurrentUserUuid() {
        // TODO: Spring Security에서 현재 사용자의 UUID를 가져오는 로직 구현
        return "current-user-uuid";
    }
} 