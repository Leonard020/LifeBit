/**
 * 식사시간 변환 유틸리티
 * 한글 ↔ 영어 변환을 중앙화하여 일관성 보장
 */

// DB enum과 일치하는 영어 식사시간 타입
export type EnglishMealTimeType = 'breakfast' | 'lunch' | 'dinner' | 'midnight' | 'snack';

// 사용자 친화적인 한글 식사시간 타입  
export type KoreanMealTimeType = '아침' | '점심' | '저녁' | '야식' | '간식';

/**
 * 한글 → 영어 변환 매핑
 */
export const KOREAN_TO_ENGLISH: Record<KoreanMealTimeType, EnglishMealTimeType> = {
  "아침": "breakfast",
  "점심": "lunch", 
  "저녁": "dinner",
  "야식": "midnight",
  "간식": "snack"
} as const;

/**
 * 영어 → 한글 변환 매핑
 */
export const ENGLISH_TO_KOREAN: Record<EnglishMealTimeType, KoreanMealTimeType> = {
  "breakfast": "아침",
  "lunch": "점심",
  "dinner": "저녁",
  "midnight": "야식", 
  "snack": "간식"
} as const;

/**
 * 한글 식사시간을 영어로 변환
 * @param koreanMealTime 한글 식사시간
 * @returns 영어 식사시간 또는 기본값(snack)
 */
export const convertKoreanToEnglish = (koreanMealTime: string): EnglishMealTimeType => {
  return KOREAN_TO_ENGLISH[koreanMealTime as KoreanMealTimeType] || 'snack';
};

/**
 * 영어 식사시간을 한글로 변환
 * @param englishMealTime 영어 식사시간
 * @returns 한글 식사시간 또는 기본값(간식)
 */
export const convertEnglishToKorean = (englishMealTime: string): KoreanMealTimeType => {
  return ENGLISH_TO_KOREAN[englishMealTime as EnglishMealTimeType] || '간식';
};

/**
 * 현재 시간을 기준으로 적절한 식사시간 추론
 * @returns 현재 시간대에 맞는 영어 식사시간
 */
export const inferMealTimeFromCurrentHour = (): EnglishMealTimeType => {
  const hour = new Date().getHours();
  
  if (hour >= 6 && hour < 11) return 'breakfast';   // 06:00 - 10:59
  if (hour >= 11 && hour < 15) return 'lunch';      // 11:00 - 14:59
  if (hour >= 15 && hour < 18) return 'snack';      // 15:00 - 17:59
  if (hour >= 18 && hour < 22) return 'dinner';     // 18:00 - 21:59
  return 'midnight';                                 // 22:00 - 05:59 (야식)
};

/**
 * 모든 식사시간 옵션 반환 (UI용)
 * @returns {value: 영어, label: 한글} 형태의 배열
 */
export const getAllMealTimeOptions = () => [
  { value: 'breakfast', label: '아침' },
  { value: 'lunch', label: '점심' },
  { value: 'dinner', label: '저녁' },
  { value: 'midnight', label: '야식' },
  { value: 'snack', label: '간식' }
];

/**
 * 안전한 식사시간 변환 (fallback 포함)
 * @param input 사용자 입력 (한글 또는 영어)
 * @returns 유효한 영어 식사시간
 */
export const safeConvertMealTime = (input: string | null | undefined): EnglishMealTimeType => {
  if (!input) return inferMealTimeFromCurrentHour();
  
  // 한글인 경우
  if (KOREAN_TO_ENGLISH[input as KoreanMealTimeType]) {
    return KOREAN_TO_ENGLISH[input as KoreanMealTimeType];
  }
  
  // 영어인 경우 
  if (ENGLISH_TO_KOREAN[input as EnglishMealTimeType]) {
    return input as EnglishMealTimeType;
  }
  
  // 둘 다 아닌 경우 시간 기반 추론
  return inferMealTimeFromCurrentHour();
}; 