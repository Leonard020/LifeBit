package com.lifebit.coreapi.service;

import com.lifebit.coreapi.dto.DietCalendarDTO;
import com.lifebit.coreapi.dto.DietLogDTO;
import com.lifebit.coreapi.dto.DietNutritionDTO;
import com.lifebit.coreapi.entity.*;
import com.lifebit.coreapi.repository.FoodItemRepository;
import com.lifebit.coreapi.repository.MealLogRepository;
import com.lifebit.coreapi.repository.UserGoalRepository;
import com.lifebit.coreapi.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class DietService {
    private final MealLogRepository mealLogRepository;
    private final FoodItemRepository foodItemRepository;
    private final UserRepository userRepository;
    private final UserGoalRepository userGoalRepository;
    private final UserGoalService userGoalService;

    public List<DietLogDTO> getDailyDietRecords(LocalDate date, Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        log.info("🔍 [DietService] 일일 식단 기록 조회 시작 - 사용자: {}, 날짜: {}", userId, date);
        
        // 디버깅: SQL로 직접 확인
        log.info("🔍 [DietService] SQL 확인 - SELECT * FROM meal_logs WHERE user_id = {} AND log_date = '{}'", userId, date);
        log.info("🔍 [DietService] SQL 확인 - SELECT * FROM food_items WHERE food_item_id = 53");
        
        List<MealLog> mealLogs = mealLogRepository.findByUserAndLogDateOrderByLogDateDescCreatedAtDesc(user, date);
        
        log.info("📊 [DietService] 조회된 MealLog 수: {}", mealLogs.size());
        
        // 각 MealLog의 상세 정보 로깅
        for (int i = 0; i < mealLogs.size(); i++) {
            MealLog mealLog = mealLogs.get(i);
            FoodItem foodItem = mealLog.getFoodItem();
            
            log.info("🍽️ [DietService] MealLog[{}]: ID={}, FoodItem={}, Quantity={}", 
                i, mealLog.getMealLogId(), 
                foodItem != null ? "존재(ID:" + foodItem.getFoodItemId() + ")" : "NULL",
                mealLog.getQuantity());
                
            // FoodItem이 null인 경우 추가 조사
            if (foodItem == null) {
                log.warn("❌ [DietService] FoodItem이 null - MealLogId: {}, 직접 조회 시도", mealLog.getMealLogId());
                
                // 직접 FoodItem 조회 시도 (디버깅용)
                try {
                    // MealLog에서 food_item_id를 직접 확인할 수 없으므로 Repository로 재조회
                    MealLog reloadedMealLog = mealLogRepository.findById(mealLog.getMealLogId()).orElse(null);
                    if (reloadedMealLog != null && reloadedMealLog.getFoodItem() != null) {
                        log.info("✅ [DietService] 재조회 성공 - FoodItemId: {}", reloadedMealLog.getFoodItem().getFoodItemId());
                    } else {
                        log.error("❌ [DietService] 재조회도 실패 - MealLogId: {}", mealLog.getMealLogId());
                    }
                } catch (Exception e) {
                    log.error("❌ [DietService] FoodItem 재조회 중 오류: {}", e.getMessage());
                }
            }
        }
        
        List<DietLogDTO> result = mealLogs.stream()
            .map(this::convertToDietLogDTO)
            .collect(Collectors.toList());
            
        log.info("✅ [DietService] 변환 완료된 DietLogDTO 수: {}", result.size());
        
        return result;
    }

    public List<DietNutritionDTO> getNutritionGoals(LocalDate date, Long userId) {
        // 사용자별 목표 가져오기 - 최신 목표만 가져오도록 수정
        UserGoal userGoal = userGoalRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
            .orElse(userGoalService.getDefaultDietGoalByGender(userId));

        // 해당 날짜의 실제 섭취량 계산 (직접 엔티티 조회)
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        List<MealLog> dailyMealLogs = mealLogRepository.findByUserAndLogDateOrderByLogDateDescCreatedAtDesc(user, date);

        double totalCalories = 0.0;
        double totalCarbs = 0.0;
        double totalProtein = 0.0;
        double totalFat = 0.0;

        for (MealLog mealLog : dailyMealLogs) {
            FoodItem foodItem = mealLog.getFoodItem();
            if (foodItem == null) {
                continue; // 음식이 없는 기록은 건너뛰기
            }
            BigDecimal quantity = mealLog.getQuantity();
            
            if (foodItem.getCalories() != null) {
                totalCalories += foodItem.getCalories().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
            }
            if (foodItem.getCarbs() != null) {
                totalCarbs += foodItem.getCarbs().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
            }
            if (foodItem.getProtein() != null) {
                totalProtein += foodItem.getProtein().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
            }
            if (foodItem.getFat() != null) {
                totalFat += foodItem.getFat().multiply(quantity).divide(new BigDecimal(100)).doubleValue();
            }
        }

        // 목표 대비 백분율 계산 (Integer -> double 변환)
        return List.of(
            new DietNutritionDTO("칼로리", userGoal.getDailyCaloriesTarget() != null ? userGoal.getDailyCaloriesTarget().doubleValue() : 1500.0, totalCalories, "kcal", 
                calculatePercentage(totalCalories, userGoal.getDailyCaloriesTarget() != null ? userGoal.getDailyCaloriesTarget().doubleValue() : 1500.0)),
            new DietNutritionDTO("탄수화물", userGoal.getDailyCarbsTarget().doubleValue(), totalCarbs, "g", 
                calculatePercentage(totalCarbs, userGoal.getDailyCarbsTarget().doubleValue())),
            new DietNutritionDTO("단백질", userGoal.getDailyProteinTarget().doubleValue(), totalProtein, "g", 
                calculatePercentage(totalProtein, userGoal.getDailyProteinTarget().doubleValue())),
            new DietNutritionDTO("지방", userGoal.getDailyFatTarget().doubleValue(), totalFat, "g", 
                calculatePercentage(totalFat, userGoal.getDailyFatTarget().doubleValue()))
        );
    }

    public Map<String, DietCalendarDTO> getCalendarRecords(Long userId, int year, int month) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();
        
        Map<String, DietCalendarDTO> calendarData = new HashMap<>();
        
        // 해당 월의 식단 기록 가져오기 (운동은 제외)
        List<MealLog> dietRecords = mealLogRepository.findByUserAndLogDateBetweenOrderByLogDateDesc(user, startDate, endDate);
        
        // 식단 기록 처리
        for (MealLog mealLog : dietRecords) {
            String dateStr = mealLog.getLogDate().toString();
            
            DietCalendarDTO dto = calendarData.getOrDefault(dateStr, new DietCalendarDTO());
            dto.setHasDiet(true);
            dto.setDietCount(dto.getDietCount() + 1);
            calendarData.put(dateStr, dto);
        }
        
        return calendarData;
    }

    @Transactional
    public DietLogDTO recordDiet(DietLogDTO request) {
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        FoodItem foodItem = foodItemRepository.findById(request.getFoodItemId())
            .orElseThrow(() -> new RuntimeException("Food item not found"));

        MealLog mealLog = new MealLog();
        mealLog.setUuid(UUID.randomUUID());
        mealLog.setUser(user);
        mealLog.setFoodItem(foodItem);
        mealLog.setQuantity(BigDecimal.valueOf(request.getQuantity()));
        mealLog.setLogDate(LocalDate.parse(request.getLogDate()));
        mealLog.setCreatedAt(LocalDateTime.now());

        // 추가: DTO의 필드를 Entity에 안전하게 매핑
        mealLog.setMealTime(convertMealTimeWithFallback(request.getMealTime()));
        
        if (request.getInputSource() != null) {
            try {
                mealLog.setInputSource(InputSourceType.valueOf(request.getInputSource().toUpperCase()));
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid inputSource value received: " + request.getInputSource() + ", using default: TYPING");
                mealLog.setInputSource(InputSourceType.TYPING);
            }
        } else {
            mealLog.setInputSource(InputSourceType.TYPING); // 기본값
        }
        
        if (request.getConfidenceScore() != null) {
            mealLog.setConfidenceScore(BigDecimal.valueOf(request.getConfidenceScore()));
        }
        if (request.getOriginalAudioPath() != null) {
            mealLog.setOriginalAudioPath(request.getOriginalAudioPath());
        }
        
        if (request.getValidationStatus() != null) {
            try {
                mealLog.setValidationStatus(ValidationStatusType.valueOf(request.getValidationStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                System.err.println("Invalid validationStatus value received: " + request.getValidationStatus() + ", using default: VALIDATED");
                mealLog.setValidationStatus(ValidationStatusType.VALIDATED);
            }
        } else {
            mealLog.setValidationStatus(ValidationStatusType.VALIDATED); // 기본값
        }
        
        if (request.getValidationNotes() != null) {
            mealLog.setValidationNotes(request.getValidationNotes());
        }
        // createdAt은 이미 위에서 설정

        MealLog savedMealLog = mealLogRepository.save(mealLog);
        return convertToDietLogDTO(savedMealLog);
    }

    @Transactional
    public DietLogDTO updateDietRecord(Long id, DietLogDTO request) {
        MealLog mealLog = mealLogRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 ID의 식단 기록을 찾을 수 없습니다: " + id));

        FoodItem foodToLink;

        // foodItemId가 요청에 포함되어 있으면, 기존 FoodItem을 찾아 연결합니다.
        if (request.getFoodItemId() != null) {
            foodToLink = foodItemRepository.findById(request.getFoodItemId())
                    .orElseThrow(() -> new RuntimeException("Food item not found with id: " + request.getFoodItemId()));
        } else {
            // foodItemId가 없으면, 새로운 FoodItem을 생성합니다 (사용자 커스텀 음식).
            FoodItem newFoodItem = new FoodItem();
            newFoodItem.setUuid(UUID.randomUUID());
            newFoodItem.setCreatedAt(LocalDateTime.now());
            newFoodItem.setName(request.getFoodName());
            newFoodItem.setServingSize(BigDecimal.valueOf(100)); // 100g 기준
            newFoodItem.setCalories(BigDecimal.valueOf(request.getCalories()));
            newFoodItem.setCarbs(BigDecimal.valueOf(request.getCarbs()));
            newFoodItem.setProtein(BigDecimal.valueOf(request.getProtein()));
            newFoodItem.setFat(BigDecimal.valueOf(request.getFat()));

            foodToLink = foodItemRepository.save(newFoodItem);
        }
        
        // MealLog가 최종 FoodItem을 가리키도록 설정하고 섭취량 업데이트
        mealLog.setFoodItem(foodToLink);
        mealLog.setQuantity(BigDecimal.valueOf(request.getQuantity()));
        mealLog.setMealTime(convertMealTimeWithFallback(request.getMealTime()));
        
        MealLog updatedMealLog = mealLogRepository.save(mealLog);
        return convertToDietLogDTO(updatedMealLog);
    }

    @Transactional
    public void deleteDietRecord(Long id) {
        mealLogRepository.deleteById(id);
    }

    /**
     * 식품 검색
     */
    public List<Map<String, Object>> searchFoodItems(String keyword) {
        List<FoodItem> foodItems = foodItemRepository.findByNameContainingIgnoreCase(keyword);
        
        return foodItems.stream()
            .map(this::convertFoodItemToMap)
            .collect(Collectors.toList());
    }

    private Map<String, Object> convertFoodItemToMap(FoodItem foodItem) {
        Map<String, Object> map = new HashMap<>();
        map.put("foodItemId", foodItem.getFoodItemId());
        map.put("name", foodItem.getName());
        map.put("calories", foodItem.getCalories() != null ? foodItem.getCalories().doubleValue() : 0.0);
        map.put("carbs", foodItem.getCarbs() != null ? foodItem.getCarbs().doubleValue() : 0.0);
        map.put("protein", foodItem.getProtein() != null ? foodItem.getProtein().doubleValue() : 0.0);
        map.put("fat", foodItem.getFat() != null ? foodItem.getFat().doubleValue() : 0.0);
        map.put("servingSize", foodItem.getServingSize() != null ? foodItem.getServingSize().doubleValue() : 100.0);
        return map;
    }

    private DietLogDTO convertToDietLogDTO(MealLog mealLog) {
        FoodItem foodItem = mealLog.getFoodItem();

        log.debug("🔄 [DietService] convertToDietLogDTO 시작 - MealLogId: {}, FoodItem: {}", 
            mealLog.getMealLogId(), foodItem != null ? foodItem.getFoodItemId() : "NULL");

        DietLogDTO dto = new DietLogDTO();
        dto.setId(mealLog.getMealLogId());
        dto.setQuantity(mealLog.getQuantity().doubleValue());
        dto.setMealTime(mealLog.getMealTime().name());
        dto.setUnit("g"); // 기본 단위 설정
        dto.setLogDate(mealLog.getLogDate().toString());
        dto.setCreatedAt(mealLog.getCreatedAt().toString());

        if (foodItem == null) {
            log.warn("⚠️ [DietService] FoodItem이 null입니다 - MealLogId: {}, 기본값으로 설정", mealLog.getMealLogId());
            
            // FoodItem이 null이어도 기본 정보는 반환
            dto.setFoodItemId(null);
            dto.setFoodName("알 수 없는 음식");
            dto.setCalories(0.0);
            dto.setCarbs(0.0);
            dto.setProtein(0.0);
            dto.setFat(0.0);
            
            return dto;
        }

        // FoodItem이 존재하는 경우 정상 처리
        dto.setFoodItemId(foodItem.getFoodItemId());
        dto.setFoodName(foodItem.getName());

        BigDecimal quantity = mealLog.getQuantity();
        BigDecimal HUNDRED = new BigDecimal("100.0");

        dto.setCalories(foodItem.getCalories() != null ? foodItem.getCalories().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setCarbs(foodItem.getCarbs() != null ? foodItem.getCarbs().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setProtein(foodItem.getProtein() != null ? foodItem.getProtein().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setFat(foodItem.getFat() != null ? foodItem.getFat().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);

        log.debug("✅ [DietService] convertToDietLogDTO 완료 - MealLogId: {}, FoodName: {}", 
            mealLog.getMealLogId(), dto.getFoodName());

        return dto;
    }

    private double calculatePercentage(double current, double target) {
        if (target == 0) return 0;
        return Math.min((current / target) * 100, 100);
    }

    /**
     * 식사시간 변환 with 지능적 fallback
     * 한글 → 영어 변환 및 시간대 기반 추론
     */
    private MealTimeType convertMealTimeWithFallback(String mealTime) {
        if (mealTime == null || mealTime.trim().isEmpty()) {
            return inferMealTimeFromCurrentHour();
        }
        
        // 한글 → 영어 변환 매핑
        Map<String, String> koreanToEnglish = Map.of(
            "아침", "breakfast",
            "점심", "lunch",
            "저녁", "dinner", 
            "야식", "midnight",
            "간식", "snack"
        );
        
        String englishMealTime = koreanToEnglish.getOrDefault(mealTime, mealTime);
        
        try {
            return MealTimeType.valueOf(englishMealTime.toLowerCase());
        } catch (IllegalArgumentException e) {
            System.err.println("Invalid mealTime value received: " + mealTime + ", using time-based inference");
            return inferMealTimeFromCurrentHour();
        }
    }

    /**
     * 현재 시간을 기준으로 적절한 식사시간 추론
     */
    private MealTimeType inferMealTimeFromCurrentHour() {
        int hour = java.time.LocalTime.now().getHour();
        
        if (hour >= 6 && hour < 11) return MealTimeType.breakfast;   // 06:00 - 10:59
        if (hour >= 11 && hour < 15) return MealTimeType.lunch;      // 11:00 - 14:59
        if (hour >= 15 && hour < 18) return MealTimeType.snack;      // 15:00 - 17:59
        if (hour >= 18 && hour < 22) return MealTimeType.dinner;     // 18:00 - 21:59
        return MealTimeType.midnight;                                // 22:00 - 05:59 (야식)
    }

    @Transactional
    public Long createCustomFoodItem(String name, Double calories, Double carbs, Double protein, Double fat) {
        FoodItem foodItem = new FoodItem();
        foodItem.setUuid(UUID.randomUUID());
        foodItem.setName(name);
        foodItem.setServingSize(BigDecimal.valueOf(100));
        foodItem.setCalories(BigDecimal.valueOf(calories));
        foodItem.setCarbs(BigDecimal.valueOf(carbs));
        foodItem.setProtein(BigDecimal.valueOf(protein));
        foodItem.setFat(BigDecimal.valueOf(fat));
        foodItem.setCreatedAt(LocalDateTime.now());
        FoodItem saved = foodItemRepository.save(foodItem);
        return saved.getFoodItemId();
    }

    @Transactional
    public Map<String, Object> updateFoodItem(Long id, Double calories, Double carbs, Double protein, Double fat) {
        FoodItem foodItem = foodItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Food item not found with id: " + id));
        
        if (calories != null) {
            foodItem.setCalories(BigDecimal.valueOf(calories));
        }
        if (carbs != null) {
            foodItem.setCarbs(BigDecimal.valueOf(carbs));
        }
        if (protein != null) {
            foodItem.setProtein(BigDecimal.valueOf(protein));
        }
        if (fat != null) {
            foodItem.setFat(BigDecimal.valueOf(fat));
        }
        
        FoodItem updatedFoodItem = foodItemRepository.save(foodItem);
        return convertFoodItemToMap(updatedFoodItem);
    }
} 