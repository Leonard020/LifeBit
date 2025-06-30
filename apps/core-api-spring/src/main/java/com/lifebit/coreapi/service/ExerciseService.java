package com.lifebit.coreapi.service;

import com.lifebit.coreapi.entity.ExerciseCatalog;
import com.lifebit.coreapi.entity.ExerciseSession;
import com.lifebit.coreapi.entity.User;
import com.lifebit.coreapi.repository.ExerciseCatalogRepository;
import com.lifebit.coreapi.repository.ExerciseSessionRepository;
import com.lifebit.coreapi.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.lifebit.coreapi.entity.TimePeriodType;
import java.util.Map;
import java.util.HashMap;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
@Slf4j
public class ExerciseService {
    private final ExerciseSessionRepository exerciseSessionRepository;
    private final ExerciseCatalogRepository exerciseCatalogRepository;
    private final UserRepository userRepository;

    @Transactional
    public ExerciseSession recordExercise(
            Long userId, Long catalogId, Integer duration_minutes, Integer caloriesBurned, String notes,
            Integer sets, Integer reps, Double weight, LocalDate exerciseDate, TimePeriodType timePeriod) {
        ExerciseCatalog catalog = exerciseCatalogRepository.findById(catalogId)
                .orElseThrow(() -> new EntityNotFoundException("Exercise catalog not found"));

        ExerciseSession session = new ExerciseSession();
        session.setUuid(UUID.randomUUID());
        session.setUser(userRepository.getReferenceById(userId));
        session.setExerciseCatalog(catalog);
        session.setDurationMinutes(duration_minutes);
        session.setCaloriesBurned(caloriesBurned);
        session.setNotes(notes);
        session.setExerciseDate(exerciseDate != null ? exerciseDate : LocalDate.now());
        session.setCreatedAt(LocalDateTime.now());

        // ✅ 유산소 운동(cardio)인 경우 set=1로 고정
        if (catalog.getBodyPart() == com.lifebit.coreapi.entity.BodyPartType.cardio) {
            session.setSets(1); // 유산소 운동은 항상 1 set
            session.setReps(null); // 유산소 운동은 반복횟수 없음
            session.setWeight(null); // 유산소 운동은 중량 없음
            log.info("✅ 유산소 운동({}) - set=1로 자동 설정", catalog.getName());
        } else {
            session.setSets(sets != null ? sets : 0);
            session.setReps(reps != null ? reps : 0);
            session.setWeight(weight != null ? BigDecimal.valueOf(weight) : BigDecimal.ZERO);
        }
        
        session.setTimePeriod(timePeriod);

        return exerciseSessionRepository.save(session);
    }

    public List<ExerciseSession> getExerciseHistory(User user, LocalDate startDate, LocalDate endDate) {
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }

    public List<ExerciseCatalog> searchExercises(String keyword) {
        return exerciseCatalogRepository.findByNameContainingIgnoreCase(keyword);
    }

    public List<ExerciseCatalog> getExercisesByBodyPart(String bodyPart) {
        // String을 BodyPartType으로 변환
        try {
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = com.lifebit.coreapi.entity.BodyPartType
                    .valueOf(bodyPart.toUpperCase());
            return exerciseCatalogRepository.findByBodyPart(bodyPartType);
        } catch (IllegalArgumentException e) {
            // 잘못된 bodyPart 값인 경우 빈 리스트 반환
            return List.of();
        }
    }

    /**
     * 사용자의 최근 운동 세션 조회 (기간별)
     * 차트 시작점에 적절한 데이터가 표시되도록 충분한 과거 데이터를 포함하여 조회
     */
    public List<ExerciseSession> getRecentExerciseSessions(Long userId, String period) {
        log.info("🏃 [ExerciseService] getRecentExerciseSessions 시작 - userId: {}, period: {}", userId, period);
        
        LocalDate today = LocalDate.now();
        LocalDate startDate;
        LocalDate endDate;

        // 기간에 따른 시작 날짜 계산 (3개월 전 데이터 포함 + 미래 데이터도 포함)
        switch (period.toLowerCase()) {
            case "day":
                startDate = today.minusDays(97);  // 최근 7일 + 3개월 전 데이터 (7 + 90 = 97일)
                endDate = today.plusDays(1);      // 내일까지
                break;
            case "week":
                startDate = today.minusDays(132); // 최근 6주 + 3개월 전 데이터 (42 + 90 = 132일)
                endDate = today.plusWeeks(1);     // 다음 주까지
                break;
            case "month":
                startDate = today.minusDays(270); // 최근 6개월 + 3개월 전 데이터 (180 + 90 = 270일)
                endDate = today.plusMonths(1);    // 다음 달까지
                break;
            case "year":
                startDate = today.minusDays(455); // 최근 1년 + 3개월 전 데이터 (365 + 90 = 455일)
                endDate = today.plusYears(1);     // 다음 년까지
                break;
            default:
                startDate = today.minusDays(270); // 기본값: 9개월
                endDate = today.plusMonths(1);    // 다음 달까지
        }

        log.info("🔧 [ExerciseService] 날짜 범위 계산 완료 - startDate: {}, endDate: {}", startDate, endDate);
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        log.info("✅ [ExerciseService] 운동 세션 조회 완료 - userId: {}, period: {}, 결과: {} 건", userId, period, sessions.size());
        
        if (sessions.isEmpty()) {
            log.warn("⚠️ [ExerciseService] 운동 세션이 없음 - userId: {}, 날짜범위: {} ~ {}", userId, startDate, endDate);
        } else {
            ExerciseSession sample = sessions.get(0);
            log.info("📋 [ExerciseService] 샘플 세션 - ID: {}, 날짜: {}, 운동: {}", 
                sample.getExerciseSessionId(), 
                sample.getExerciseDate(),
                sample.getExerciseCatalog() != null ? sample.getExerciseCatalog().getName() : "알 수 없음");
        }
        
        return sessions;
    }

    /**
     * 사용자의 최근 N일간 운동 세션 조회
     */
    public List<ExerciseSession> getRecentExerciseSessions(Long userId, int days) {
        LocalDate startDate = LocalDate.now().minusDays(days);
        LocalDate endDate = LocalDate.now();
        User user = userRepository.getReferenceById(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }

    /**
     * 주간 운동 횟수 조회 (일요일~토요일 기준)
     */
    public int getWeeklyExerciseCount(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        return sessions.size();
    }

    /**
     * 주간 총 칼로리 소모량 조회 (일요일~토요일 기준)
     */
    public int getWeeklyCaloriesBurned(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        return sessions.stream()
                .mapToInt(session -> session.getCaloriesBurned() != null ? session.getCaloriesBurned() : 0)
                .sum();
    }

    /**
     * 현재 연속 운동 일수 계산
     */
    public int getCurrentStreak(Long userId) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, 365); // 최근 1년
        if (sessions.isEmpty()) {
            return 0;
        }

        int streak = 0;
        LocalDate currentDate = LocalDate.now();

        // 오늘부터 역순으로 연속 운동 일수 계산
        for (ExerciseSession session : sessions) {
            if (session.getExerciseDate().equals(currentDate)) {
                streak++;
                currentDate = currentDate.minusDays(1);
            } else if (session.getExerciseDate().isBefore(currentDate)) {
                break; // 연속이 끊어짐
            }
        }

        return streak;
    }

    /**
     * 총 운동 일수 조회
     */
    public int getTotalWorkoutDays(Long userId) {
        User user = userRepository.getReferenceById(userId);
        return (int) exerciseSessionRepository.countDistinctExerciseDateByUser(user);
    }

    /**
     * 운동 카탈로그 찾기 또는 생성 메서드 추가
     */
    @Transactional
    public ExerciseCatalog findOrCreateExercise(String name, String bodyPart, String description) {
        // 먼저 기존 운동 검색
        List<ExerciseCatalog> existingExercises = exerciseCatalogRepository.findByNameContainingIgnoreCase(name);

        if (!existingExercises.isEmpty()) {
            // 정확히 일치하는 이름이 있는지 확인
            for (ExerciseCatalog exercise : existingExercises) {
                if (exercise.getName().equalsIgnoreCase(name)) {
                    return exercise;
                }
            }
        }

        // 새로운 운동 카탈로그 생성
        ExerciseCatalog newExercise = new ExerciseCatalog();
        newExercise.setUuid(java.util.UUID.randomUUID());
        newExercise.setName(name);

        // bodyPart를 BodyPartType으로 변환
        try {
            com.lifebit.coreapi.entity.BodyPartType bodyPartType = com.lifebit.coreapi.entity.BodyPartType
                    .valueOf(bodyPart.toUpperCase());
            newExercise.setBodyPart(bodyPartType);
        } catch (IllegalArgumentException e) {
            // 기본값 설정
            newExercise.setBodyPart(com.lifebit.coreapi.entity.BodyPartType.cardio);
        }

        newExercise.setDescription(description);
        newExercise.setCreatedAt(LocalDateTime.now());

        return exerciseCatalogRepository.save(newExercise);
    }

    /**
     * ID로 운동 세션 조회
     */
    public ExerciseSession getExerciseSessionById(Long sessionId) {
        return exerciseSessionRepository.findById(sessionId).orElse(null);
    }

    /**
     * ID로 운동 카탈로그 조회
     */
    public ExerciseCatalog getExerciseCatalogById(Long catalogId) {
        return exerciseCatalogRepository.findById(catalogId).orElse(null);
    }

    /**
     * 운동 세션에 운동 카탈로그 설정
     */
    @Transactional
    public ExerciseSession setExerciseCatalog(ExerciseSession session, Long catalogId) {
        ExerciseCatalog catalog = exerciseCatalogRepository.findById(catalogId)
                .orElseThrow(() -> new RuntimeException("운동 종류를 찾을 수 없습니다."));
        session.setExerciseCatalog(catalog);
        return session;
    }

    /**
     * 운동 세션 업데이트
     */
    @Transactional
    public ExerciseSession updateExerciseSession(ExerciseSession exerciseSession) {
        // 💥 기존 세션은 detached 상태일 수 있으므로, merge 전에 다시 참조 획득
        ExerciseSession managedSession = exerciseSessionRepository.findById(exerciseSession.getExerciseSessionId())
                .orElseThrow(() -> new RuntimeException("운동 세션을 찾을 수 없습니다."));

        // 필드 복사
        managedSession.setDurationMinutes(exerciseSession.getDurationMinutes());
        managedSession.setCaloriesBurned(exerciseSession.getCaloriesBurned());
        managedSession.setNotes(exerciseSession.getNotes());
        managedSession.setExerciseDate(exerciseSession.getExerciseDate());
        managedSession.setSets(exerciseSession.getSets());
        managedSession.setReps(exerciseSession.getReps());
        managedSession.setWeight(exerciseSession.getWeight());
        managedSession.setTimePeriod(exerciseSession.getTimePeriod());

        // ✅ 연관관계도 확인
        if (exerciseSession.getExerciseCatalog() != null) {
            ExerciseCatalog catalog = exerciseCatalogRepository.findById(
                    exerciseSession.getExerciseCatalog().getExerciseCatalogId())
                    .orElseThrow(() -> new RuntimeException("운동 카탈로그를 찾을 수 없습니다."));
            managedSession.setExerciseCatalog(catalog);
        }

        // 이 시점에서는 Lazy 로딩 OK
        managedSession.getExerciseCatalog().getName();
        managedSession.getUser().getUserId();

        return managedSession;
    }

    /**
     * 운동 세션 삭제
     */
    @Transactional
    public void deleteExerciseSession(Long sessionId) {
        if (!exerciseSessionRepository.existsById(sessionId)) {
            throw new RuntimeException("운동 세션을 찾을 수 없습니다: " + sessionId);
        }
        exerciseSessionRepository.deleteById(sessionId);
    }

    /**
     * 모든 운동 카탈로그 조회
     */
    public List<ExerciseCatalog> getAllExerciseCatalog() {
        return exerciseCatalogRepository.findAll();
    }

    /**
     * 지정된 기간 동안의 운동 횟수 조회
     */
    public int getExerciseCountByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.size();
    }

    /**
     * 지정된 기간 동안의 총 운동 시간(분) 조회
     */
    public int getExerciseMinutesByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.stream()
                .mapToInt(session -> session.getDurationMinutes() != null ? session.getDurationMinutes() : 0)
                .sum();
    }

    /**
     * 지정된 기간 동안의 총 칼로리 소모량 조회
     */
    public int getCaloriesBurnedByPeriod(Long userId, int days) {
        List<ExerciseSession> sessions = getRecentExerciseSessions(userId, days);
        return sessions.stream()
                .mapToInt(session -> session.getCaloriesBurned() != null ? session.getCaloriesBurned() : 0)
                .sum();
    }

    public List<ExerciseSession> getExerciseSessions(Long userId, LocalDate startDate, LocalDate endDate) {
        User user = userRepository.getReferenceById(userId);
        return exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
    }

    /**
     * 주간 운동 부위별 운동 횟수 조회 (일요일~토요일 기준)
     */
    public Map<String, Integer> getWeeklyBodyPartCounts(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        log.info("🗓️ [getWeeklyBodyPartCounts] 주별 운동 부위별 빈도 조회 - 사용자: {}, 기간: {} ~ {} (오늘: {})", 
                userId, startDate, endDate, today);
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        log.info("📊 [getWeeklyBodyPartCounts] 조회된 운동 세션 수: {}", sessions.size());
        
        Map<String, Integer> bodyPartCounts = new HashMap<>();
        bodyPartCounts.put("CHEST", 0);
        bodyPartCounts.put("BACK", 0);
        bodyPartCounts.put("LEGS", 0);
        bodyPartCounts.put("SHOULDERS", 0);
        bodyPartCounts.put("ARMS", 0);
        bodyPartCounts.put("ABS", 0);
        bodyPartCounts.put("CARDIO", 0);
        
        for (ExerciseSession session : sessions) {
            String bodyPart = null;
            if (session.getExerciseCatalog() != null && session.getExerciseCatalog().getBodyPart() != null) {
                bodyPart = session.getExerciseCatalog().getBodyPart().name().toUpperCase();
            } else if (session.getNotes() != null) {
                String note = session.getNotes().toLowerCase();
                if (note.contains("조깅") || note.contains("달리기") || note.contains("런닝") || note.contains("걷기") || note.contains("run")) {
                    bodyPart = "CARDIO";
                }
            }
            if (bodyPart != null) {
                bodyPartCounts.put(bodyPart, bodyPartCounts.getOrDefault(bodyPart, 0) + 1); // 횟수로 카운트
            }
        }
        
        log.info("✅ [getWeeklyBodyPartCounts] 결과: {}", bodyPartCounts);
        return bodyPartCounts;
    }

    /**
     * 주간 가슴 운동 횟수 조회
     */
    public int getWeeklyChestCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("CHEST", 0);
    }

    /**
     * 주간 등 운동 횟수 조회
     */
    public int getWeeklyBackCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("BACK", 0);
    }

    /**
     * 주간 다리 운동 횟수 조회
     */
    public int getWeeklyLegsCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("LEGS", 0);
    }

    /**
     * 주간 어깨 운동 횟수 조회
     */
    public int getWeeklyShouldersCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("SHOULDERS", 0);
    }

    /**
     * 주간 팔 운동 횟수 조회
     */
    public int getWeeklyArmsCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("ARMS", 0);
    }

    /**
     * 주간 복근 운동 횟수 조회
     */
    public int getWeeklyAbsCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("ABS", 0);
    }

    /**
     * 주간 유산소 운동 횟수 조회
     */
    public int getWeeklyCardioCount(Long userId) {
        return getWeeklyBodyPartCounts(userId).getOrDefault("CARDIO", 0);
    }

    /**
     * 주간 운동 부위별 운동 시간(분) 조회 (일요일~토요일 기준)
     */
    public Map<String, Integer> getWeeklyBodyPartMinutes(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        Map<String, Integer> bodyPartMinutes = new HashMap<>();
        bodyPartMinutes.put("CHEST", 0);
        bodyPartMinutes.put("BACK", 0);
        bodyPartMinutes.put("LEGS", 0);
        bodyPartMinutes.put("SHOULDERS", 0);
        bodyPartMinutes.put("ARMS", 0);
        bodyPartMinutes.put("ABS", 0);
        bodyPartMinutes.put("CARDIO", 0);
        
        for (ExerciseSession session : sessions) {
            String bodyPart = null;
            if (session.getExerciseCatalog() != null && session.getExerciseCatalog().getBodyPart() != null) {
                bodyPart = session.getExerciseCatalog().getBodyPart().name().toUpperCase();
            } else if (session.getNotes() != null) {
                String note = session.getNotes().toLowerCase();
                if (note.contains("조깅") || note.contains("달리기") || note.contains("런닝") || note.contains("걷기") || note.contains("run")) {
                    bodyPart = "CARDIO";
                }
            }
            if (bodyPart != null) {
                int duration = session.getDurationMinutes() != null ? session.getDurationMinutes() : 0;
                bodyPartMinutes.put(bodyPart, bodyPartMinutes.getOrDefault(bodyPart, 0) + duration);
            }
        }
        
        return bodyPartMinutes;
    }

    /**
     * 주간 총 운동 세트 수 계산 (weekly_workout_target 비교용, 일요일~토요일 기준)
     */
    public int getWeeklyTotalSets(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        return sessions.stream()
                .mapToInt(session -> {
                    Integer s = session.getSets();
                    if (s != null && s > 0) return s;
                    // 세트 수가 없는 유산소/플랭크 등은 1세트로 간주
                    return 1;
                })
                .sum();
    }

    /**
     * 주간 부위별 운동 세트 수 계산 (일요일~토요일 기준)
     */
    public Map<String, Integer> getWeeklyBodyPartSets(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        Map<String, Integer> bodyPartSets = new HashMap<>();
        bodyPartSets.put("CHEST", 0);
        bodyPartSets.put("BACK", 0);
        bodyPartSets.put("LEGS", 0);
        bodyPartSets.put("SHOULDERS", 0);
        bodyPartSets.put("ARMS", 0);
        bodyPartSets.put("ABS", 0);
        bodyPartSets.put("CARDIO", 0);
        
        for (ExerciseSession session : sessions) {
            String bodyPart = null;
            if (session.getExerciseCatalog() != null && session.getExerciseCatalog().getBodyPart() != null) {
                bodyPart = session.getExerciseCatalog().getBodyPart().name().toUpperCase();
            } else if (session.getNotes() != null) {
                String note = session.getNotes().toLowerCase();
                if (note.contains("조깅") || note.contains("달리기") || note.contains("런닝") || note.contains("걷기") || note.contains("run")) {
                    bodyPart = "CARDIO";
                }
            }
            if (bodyPart != null) {
                int setsVal;
                if (session.getSets() != null && session.getSets() > 0) {
                    setsVal = session.getSets();
                } else {
                    setsVal = 1; // 세트 정보 없으면 1로 간주
                }
                bodyPartSets.put(bodyPart, bodyPartSets.getOrDefault(bodyPart, 0) + setsVal);
            }
        }
        
        return bodyPartSets;
    }

    // 관리자 페이지에서 운동 카탈로그 조회
    public List<ExerciseCatalog> getAllCatalogs() {
        return exerciseCatalogRepository.findAll();
    }

    // ==================================================================================
    // 건강로그 페이지 전용 세트 계산 메서드들 (기존 로직과 분리)
    // ==================================================================================

    /**
     * 건강로그용 - 주간 운동 부위별 세트 수 계산 (일요일~토요일 기준)
     */
    public Map<String, Integer> getWeeklyBodyPartSets_healthloguse(Long userId) {
        // 현재 주의 일요일 찾기
        LocalDate today = LocalDate.now();
        int dayOfWeek = today.getDayOfWeek().getValue(); // 1=월요일, 7=일요일
        int daysFromSunday = (dayOfWeek == 7) ? 0 : dayOfWeek; // 일요일이면 0, 아니면 월요일부터의 일수
        
        LocalDate startDate = today.minusDays(daysFromSunday); // 이번 주 일요일
        LocalDate endDate = startDate.plusDays(6); // 이번 주 토요일
        
        log.info("🗓️ [getWeeklyBodyPartSets_healthloguse] 건강로그용 주별 운동 부위별 세트 수 조회 - 사용자: {}, 기간: {} ~ {} (오늘: {})", 
                userId, startDate, endDate, today);
        
        User user = userRepository.getReferenceById(userId);
        List<ExerciseSession> sessions = exerciseSessionRepository.findByUserAndExerciseDateBetweenOrderByExerciseDateDesc(
                user, startDate, endDate);
        
        log.info("📊 [getWeeklyBodyPartSets_healthloguse] 조회된 운동 세션 수: {}", sessions.size());
        
        Map<String, Integer> bodyPartSets = new HashMap<>();
        bodyPartSets.put("CHEST", 0);
        bodyPartSets.put("BACK", 0);
        bodyPartSets.put("LEGS", 0);
        bodyPartSets.put("SHOULDERS", 0);
        bodyPartSets.put("ARMS", 0);
        bodyPartSets.put("ABS", 0);
        bodyPartSets.put("CARDIO", 0);
        
        for (ExerciseSession session : sessions) {
            String bodyPart = null;
            if (session.getExerciseCatalog() != null && session.getExerciseCatalog().getBodyPart() != null) {
                bodyPart = session.getExerciseCatalog().getBodyPart().name().toUpperCase();
            } else if (session.getNotes() != null) {
                String note = session.getNotes().toLowerCase();
                if (note.contains("조깅") || note.contains("달리기") || note.contains("런닝") || note.contains("걷기") || note.contains("run")) {
                    bodyPart = "CARDIO";
                }
            }
            
            if (bodyPart != null) {
                Integer sets = session.getSets();
                int setsToAdd = (sets != null && sets > 0) ? sets : 1; // 세트 수가 없으면 1세트로 간주
                bodyPartSets.put(bodyPart, bodyPartSets.getOrDefault(bodyPart, 0) + setsToAdd);
            }
        }
        
        log.info("✅ [getWeeklyBodyPartSets_healthloguse] 결과: {}", bodyPartSets);
        return bodyPartSets;
    }

    /**
     * 건강로그용 - 주간 가슴 운동 세트 수 조회
     */
    public int getWeeklyChestSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("CHEST", 0);
    }

    /**
     * 건강로그용 - 주간 등 운동 세트 수 조회
     */
    public int getWeeklyBackSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("BACK", 0);
    }

    /**
     * 건강로그용 - 주간 다리 운동 세트 수 조회
     */
    public int getWeeklyLegsSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("LEGS", 0);
    }

    /**
     * 건강로그용 - 주간 어깨 운동 세트 수 조회
     */
    public int getWeeklyShouldersSet_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("SHOULDERS", 0);
    }

    /**
     * 건강로그용 - 주간 팔 운동 세트 수 조회
     */
    public int getWeeklyArmsSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("ARMS", 0);
    }

    /**
     * 건강로그용 - 주간 복근 운동 세트 수 조회
     */
    public int getWeeklyAbsSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("ABS", 0);
    }

    /**
     * 건강로그용 - 주간 유산소 운동 세트 수 조회
     */
    public int getWeeklyCardioSets_healthloguse(Long userId) {
        return getWeeklyBodyPartSets_healthloguse(userId).getOrDefault("CARDIO", 0);
    }

    /**
     * 건강로그용 - 주간 총 운동 세트 수 계산
     */
    public int getWeeklyTotalSets_healthloguse(Long userId) {
        Map<String, Integer> bodyPartSets = getWeeklyBodyPartSets_healthloguse(userId);
        return bodyPartSets.values().stream().mapToInt(Integer::intValue).sum();
    }
}