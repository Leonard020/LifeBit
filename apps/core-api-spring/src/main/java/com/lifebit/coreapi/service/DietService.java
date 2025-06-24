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
        
        List<MealLog> mealLogs = mealLogRepository.findByUserAndLogDateOrderByLogDateDescCreatedAtDesc(user, date);
        
        return mealLogs.stream()
            .map(this::convertToDietLogDTO)
            .filter(Objects::nonNull)
            .collect(Collectors.toList());
    }

    public List<DietNutritionDTO> getNutritionGoals(LocalDate date, Long userId) {
        // 사용자별 목표 가져오기
        UserGoal userGoal = userGoalRepository.findByUserId(userId)
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

        // 추가: DTO의 필드를 Entity에 매핑
        if (request.getMealTime() != null) {
            try {
                mealLog.setMealTime(MealTimeType.valueOf(request.getMealTime().toLowerCase()));
            } catch (IllegalArgumentException e) {
                // 잘못된 mealTime 값이 들어올 경우 로그를 남기고 무시 (또는 기본값 설정)
                System.err.println("Invalid mealTime value received: " + request.getMealTime());
            }
        }
        if (request.getInputSource() != null) {
            mealLog.setInputSource(InputSourceType.valueOf(request.getInputSource()));
        }
        if (request.getConfidenceScore() != null) {
            mealLog.setConfidenceScore(BigDecimal.valueOf(request.getConfidenceScore()));
        }
        if (request.getOriginalAudioPath() != null) {
            mealLog.setOriginalAudioPath(request.getOriginalAudioPath());
        }
        if (request.getValidationStatus() != null) {
            mealLog.setValidationStatus(ValidationStatusType.valueOf(request.getValidationStatus()));
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

        if (foodItem == null) {
            return null;
        }

        DietLogDTO dto = new DietLogDTO();
        dto.setId(mealLog.getMealLogId());
        dto.setFoodItemId(foodItem.getFoodItemId());
        dto.setFoodName(foodItem.getName());
        dto.setQuantity(mealLog.getQuantity().doubleValue());
        dto.setMealTime(mealLog.getMealTime().name());
        dto.setUnit("g"); // 기본 단위 설정
        dto.setLogDate(mealLog.getLogDate().toString());
        dto.setCreatedAt(mealLog.getCreatedAt().toString());

        BigDecimal quantity = mealLog.getQuantity();
        BigDecimal HUNDRED = new BigDecimal("100.0");

        dto.setCalories(foodItem.getCalories() != null ? foodItem.getCalories().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setCarbs(foodItem.getCarbs() != null ? foodItem.getCarbs().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setProtein(foodItem.getProtein() != null ? foodItem.getProtein().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);
        dto.setFat(foodItem.getFat() != null ? foodItem.getFat().multiply(quantity).divide(HUNDRED, 2, RoundingMode.HALF_UP).doubleValue() : 0.0);

        return dto;
    }

    private double calculatePercentage(double current, double target) {
        if (target == 0) return 0;
        return Math.min((current / target) * 100, 100);
    }
} 