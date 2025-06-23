package com.lifebit.coreapi.controller.ranking;

import com.lifebit.coreapi.dto.ranking.RankingResponseDto;
import com.lifebit.coreapi.dto.ranking.MyRankingResponseDto;
import com.lifebit.coreapi.dto.ranking.RankingUserDto;
import com.lifebit.coreapi.dto.ranking.RankingHistoryDto;
import com.lifebit.coreapi.dto.ranking.RankingStatsDto;
import com.lifebit.coreapi.dto.ranking.RankingRewardDto;
import com.lifebit.coreapi.service.ranking.RankingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/rankings")
@RequiredArgsConstructor
public class RankingController {

    private final RankingService rankingService;

    @GetMapping
    public ResponseEntity<RankingResponseDto> getRankingData() {
        return ResponseEntity.ok(rankingService.getRankingData());
    }

    @GetMapping("/me")
    public ResponseEntity<MyRankingResponseDto> getMyRanking() {
        return ResponseEntity.ok(rankingService.getMyRanking());
    }

    @GetMapping("/season")
    public ResponseEntity<List<RankingUserDto>> getSeasonRankings(@RequestParam int season) {
        return ResponseEntity.ok(rankingService.getSeasonRankings(season));
    }

    @GetMapping("/period")
    public ResponseEntity<List<RankingUserDto>> getPeriodRankings(@RequestParam String periodType) {
        return ResponseEntity.ok(rankingService.getPeriodRankings(periodType));
    }

    @GetMapping("/top")
    public ResponseEntity<List<RankingUserDto>> getTopRankings() {
        return ResponseEntity.ok(rankingService.getTopRankings());
    }

    @GetMapping("/history")
    public ResponseEntity<java.util.List<RankingHistoryDto>> getRankingHistory(@RequestParam(required = false) String periodType, @RequestParam(required = false) Integer season) {
        return ResponseEntity.ok(rankingService.getRankingHistory(periodType, season));
    }

    @GetMapping("/stats")
    public ResponseEntity<RankingStatsDto> getRankingStats() {
        return ResponseEntity.ok(rankingService.getRankingStats());
    }

    @GetMapping("/rewards/season")
    public ResponseEntity<java.util.List<RankingRewardDto>> getSeasonRewards(@RequestParam int season) {
        return ResponseEntity.ok(rankingService.getSeasonRewards(season));
    }

    @GetMapping("/rewards/period")
    public ResponseEntity<java.util.List<RankingRewardDto>> getPeriodRewards(@RequestParam String periodType) {
        return ResponseEntity.ok(rankingService.getPeriodRewards(periodType));
    }

    @GetMapping("/rewards/streak")
    public ResponseEntity<java.util.List<RankingRewardDto>> getStreakRewards() {
        return ResponseEntity.ok(rankingService.getStreakRewards());
    }

    @GetMapping("/rewards/me")
    public ResponseEntity<RankingRewardDto> getMyReward() {
        return ResponseEntity.ok(rankingService.getMyReward());
    }
} 