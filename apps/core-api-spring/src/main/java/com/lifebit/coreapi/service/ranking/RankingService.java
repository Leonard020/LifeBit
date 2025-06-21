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
import com.lifebit.coreapi.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class RankingService {
    private final UserRankingRepository userRankingRepository;
    private final RankingHistoryRepository rankingHistoryRepository;
    private final RankingValidator rankingValidator;
    private final UserRepository userRepository;
    private static final Logger log = LoggerFactory.getLogger(RankingService.class);

    @Transactional(readOnly = true)
    public RankingResponse getMyRanking() {
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseGet(() -> createDefaultRanking(userUuid));
        rankingValidator.validateRanking(ranking);
        return convertToRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public SeasonRankingResponse getMySeasonRanking() {
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseGet(() -> createDefaultRanking(userUuid));
        rankingValidator.validateRanking(ranking);
        return convertToSeasonRankingResponse(ranking);
    }

    @Transactional(readOnly = true)
    public PeriodRankingResponse getMyPeriodRanking(PeriodType periodType) {
        rankingValidator.validatePeriodType(periodType);
        String userUuid = getCurrentUserUuid();
        UserRanking ranking = userRankingRepository.findByUserUuid(userUuid)
                .orElseGet(() -> createDefaultRanking(userUuid));
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
                .orElseGet(() -> createDefaultRanking(userUuid));
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

    /**
     * 랭킹 데이터가 없을 때 자동으로 생성 (최초 기록 시)
     */
    private UserRanking createDefaultRanking(String userUuid) {
        // 사용자 정보 조회 (username 등)
        com.lifebit.coreapi.entity.User user = userRepository.findAll().stream()
            .filter(u -> u.getUuid().toString().equals(userUuid))
            .findFirst()
            .orElseThrow(() -> new IllegalStateException("User not found for ranking creation: " + userUuid));
        UserRanking ranking = new UserRanking();
        ranking.setUserUuid(userUuid);
        ranking.setUsername(user.getNickname());
        ranking.setTotalScore(0);
        ranking.setRankPosition(0);
        ranking.setStreakDays(0);
        ranking.setPeriodType(PeriodType.WEEKLY);
        ranking.setPeriodRank(0);
        ranking.setPeriodPoints(0);
        ranking.setSeason("Season 1");
        ranking.setSeasonRank(0);
        ranking.setSeasonPoints(0);
        ranking.setActive(true);
        ranking.setLastUpdatedAt(java.time.LocalDateTime.now());
        return userRankingRepository.save(ranking);
    }

    /**
     * 매일 새벽 3시에 전체 사용자 랭킹을 자동으로 갱신하는 스케줄러
     * (실제 랭킹 산정 로직은 프로젝트 정책에 맞게 구현 필요)
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void scheduledRankingUpdate() {
        log.info("[스케줄러] 전체 사용자 랭킹 자동 갱신 시작");
        // 예시: 전체 UserRanking을 조회하여 점수/순위/연속기록 등 갱신
        var allRankings = userRankingRepository.findAll();
        // 실제 랭킹 산정 알고리즘에 따라 아래 로직 구현
        int rank = 1;
        allRankings.sort((a, b) -> Integer.compare(b.getTotalScore(), a.getTotalScore()));
        for (UserRanking ranking : allRankings) {
            int oldRank = ranking.getRankPosition();
            ranking.setRankPosition(rank++);
            // 연속기록, 점수 등 추가 갱신 로직 필요시 구현
            ranking.setLastUpdatedAt(java.time.LocalDateTime.now());
            userRankingRepository.save(ranking);
            log.info("[랭킹 갱신] {}: {}위 (점수: {})", ranking.getUsername(), ranking.getRankPosition(), ranking.getTotalScore());
        }
        log.info("[스케줄러] 전체 사용자 랭킹 자동 갱신 완료");
    }
} 