package com.lifebit.coreapi.service.ranking;

import com.lifebit.coreapi.constant.ranking.RankingConstants;
import com.lifebit.coreapi.dto.ranking.*;
import com.lifebit.coreapi.entity.UserRanking;
import com.lifebit.coreapi.entity.RankingHistory;
import com.lifebit.coreapi.entity.enums.PeriodType;
import com.lifebit.coreapi.exception.ranking.RankingNotFoundException;
import com.lifebit.coreapi.repository.ranking.UserRankingRepository;
import com.lifebit.coreapi.repository.ranking.RankingHistoryRepository;
import com.lifebit.coreapi.validator.ranking.RankingValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import com.lifebit.coreapi.entity.User;

@Service
@RequiredArgsConstructor
public class RankingService {
    private final UserRankingRepository userRankingRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final RankingValidator rankingValidator;

    @Transactional(readOnly = true)
    public RankingResponse getMyRanking() {
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return convertToRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public SeasonRankingResponse getMySeasonRanking() {
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return convertToSeasonRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public PeriodRankingResponse getMyPeriodRanking(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);
        return convertToPeriodRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public Page<RankingResponse> getTopRankings(Pageable pageable) {
        Pageable validatedPageable = validateAndCreatePageable(pageable);
        return userRankingRepository.findTopRankings(validatedPageable)
                .map(this::convertToRankingResponse);
    }

    @Transactional(readOnly = true)
    public Page<SeasonRankingResponse> getTopSeasonRankings(String season, Pageable pageable) {
        rankingValidator.validateSeason(season);
        Pageable validatedPageable = validateAndCreatePageable(pageable);
        return userRankingRepository.findAllBySeasonOrderBySeasonPointsDesc(season, validatedPageable)
                .map(this::convertToSeasonRankingResponse);
    }

    @Transactional(readOnly = true)
    public Page<PeriodRankingResponse> getTopPeriodRankings(PeriodType periodType, Pageable pageable) {
        rankingValidator.validatePeriodType(periodType);
        Pageable validatedPageable = validateAndCreatePageable(pageable);
        return userRankingRepository.findAllByPeriodTypeOrderByTotalScoreDesc(periodType, validatedPageable)
                .map(this::convertToPeriodRankingResponse);
    }

    @Transactional(readOnly = true)
    public RankingStatsResponse getRankingStats() {
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseThrow(() -> new RankingNotFoundException(userUuid));
        rankingValidator.validateRanking(ranking);

        return RankingStatsResponse.builder()
                .totalRankings(userRankingRepository.countActiveRankingsByPeriodType(PeriodType.WEEKLY))
                .myRank(ranking.getRankPosition())
                .myTotalScore(ranking.getTotalScore())
                .myStreakDays(ranking.getStreakDays())
                .mySeasonRank(ranking.getSeasonRank())
                .mySeasonPoints(ranking.getSeasonPoints())
                .myPeriodRank(ranking.getPeriodRank())
                .myPeriodPoints(ranking.getPeriodPoints())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<RankingHistoryResponse> getRankingHistory(PeriodType periodType, String season, Pageable pageable) {
        Pageable validatedPageable = validateAndCreatePageable(pageable);
        if (periodType != null) {
            rankingValidator.validatePeriodType(periodType);
        }
        if (season != null) {
            rankingValidator.validateSeason(season);
        }
        return rankingHistoryRepository.findByPeriodTypeOrderByRecordedAtDesc(periodType, validatedPageable)
                .map(this::convertToHistoryResponse);
    }

    private String getCurrentUserUuid() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            throw new IllegalStateException("User is not authenticated.");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User) {
            User currentUser = (User) principal;
            return currentUser.getUuid().toString();
        } else if (principal instanceof String) {
            // JWT 토큰에서 직접 userUuid를 가져오는 경우 (예: UserDetailsService 구현에서 userUuid를 principal로 반환)
            return (String) principal;
        } else {
            throw new IllegalStateException("Could not get user UUID from principal.");
        }
    }

    private Pageable validateAndCreatePageable(Pageable pageable) {
        int pageSize = Math.min(pageable.getPageSize(), RankingConstants.MAX_PAGE_SIZE);
        return PageRequest.of(
            pageable.getPageNumber(),
            pageSize,
            Sort.by(Sort.Direction.DESC, "totalScore")
        );
    }

    private RankingResponse convertToRankingResponse(UserRanking ranking) {
        return RankingResponse.builder()
                .userUuid(ranking.getUserUuid())
                .username(ranking.getUsername())
                .totalScore(ranking.getTotalScore())
                .rankPosition(ranking.getRankPosition())
                .streakDays(ranking.getStreakDays())
                .build();
    }

    private SeasonRankingResponse convertToSeasonRankingResponse(UserRanking ranking) {
        return SeasonRankingResponse.builder()
                .userUuid(ranking.getUserUuid())
                .username(ranking.getUsername())
                .totalScore(ranking.getTotalScore())
                .rankPosition(ranking.getRankPosition())
                .streakDays(ranking.getStreakDays())
                .season(ranking.getSeason())
                .seasonRank(ranking.getSeasonRank())
                .seasonPoints(ranking.getSeasonPoints())
                .build();
    }

    private PeriodRankingResponse convertToPeriodRankingResponse(UserRanking ranking) {
        return PeriodRankingResponse.builder()
                .userUuid(ranking.getUserUuid())
                .username(ranking.getUsername())
                .totalScore(ranking.getTotalScore())
                .rankPosition(ranking.getRankPosition())
                .streakDays(ranking.getStreakDays())
                .periodType(ranking.getPeriodType())
                .periodRank(ranking.getPeriodRank())
                .periodPoints(ranking.getPeriodPoints())
                .build();
    }

    private RankingHistoryResponse convertToHistoryResponse(RankingHistory history) {
        return RankingHistoryResponse.builder()
                .userUuid(history.getUserUuid())
                .username(history.getUsername())
                .totalScore(history.getTotalScore())
                .rankPosition(history.getRankPosition())
                .periodType(history.getPeriodType())
                .periodRank(history.getPeriodRank())
                .periodPoints(history.getPeriodPoints())
                .season(history.getSeason())
                .seasonRank(history.getSeasonRank())
                .seasonPoints(history.getSeasonPoints())
                .streakDays(history.getStreakDays())
                .recordedAt(history.getRecordedAt())
                .build();
    }
} 