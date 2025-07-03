/**
 * 식사 시간 매핑 유틸리티
 * DB에 저장 가능한 식사 타입: 아침, 점심, 저녁, 야식, 간식
 */

export type MealTimeType = '아침' | '점심' | '저녁' | '야식' | '간식';

/**
 * 시간 문자열을 식사 카테고리로 변환
 * @param timeInput 사용자 입력 시간 (예: "오전 8시", "14:30", "저녁 7시")
 * @returns MealTimeType 또는 null (변환 불가능한 경우)
 */
export const convertTimeToMealType = (timeInput: string): MealTimeType | null => {
  // 입력값 검증
  if (!timeInput || typeof timeInput !== 'string') {
    return null;
  }
  
  const input = timeInput.toLowerCase().trim();
  
  // 빈 문자열 체크
  if (input === '') {
    return null;
  }
  
  // 이미 식사 카테고리로 입력된 경우 (우선순위 1)
  if (input.includes('아침') || input.includes('breakfast')) return '아침';
  if (input.includes('점심') || input.includes('lunch')) return '점심';
  if (input.includes('저녁') || input.includes('dinner')) return '저녁';
  if (input.includes('야식') || input.includes('late night')) return '야식';
  if (input.includes('간식') || input.includes('snack')) return '간식';
  
  // 시간 패턴 추출
  const timePatterns = [
    /(\d{1,2})시/,           // "8시", "14시"
    /(\d{1,2}):(\d{2})/,     // "8:30", "14:30"
    /오전\s*(\d{1,2})/,      // "오전 8시", "오전 8"
    /오후\s*(\d{1,2})/,      // "오후 2시", "오후 2"
    /새벽\s*(\d{1,2})/,      // "새벽 3시"
    /밤\s*(\d{1,2})/,        // "밤 11시"
  ];
  
  let hour: number | null = null;
  
  // 오전/오후 처리
  if (input.includes('오전')) {
    const match = input.match(/오전\s*(\d{1,2})/);
    if (match) {
      hour = parseInt(match[1]);
      if (hour === 12) hour = 0; // 오전 12시 = 0시
    }
  } else if (input.includes('오후')) {
    const match = input.match(/오후\s*(\d{1,2})/);
    if (match) {
      hour = parseInt(match[1]);
      if (hour !== 12) hour += 12; // 오후 시간 변환 (12시 제외)
    }
  } else if (input.includes('새벽')) {
    const match = input.match(/새벽\s*(\d{1,2})/);
    if (match) {
      hour = parseInt(match[1]);
      if (hour >= 6) hour = null; // 새벽은 1-5시만
    }
  } else if (input.includes('밤')) {
    const match = input.match(/밤\s*(\d{1,2})/);
    if (match) {
      hour = parseInt(match[1]);
      if (hour < 6) hour += 12; // 밤 시간 처리
    }
  } else {
    // 일반 시간 형식 처리
    const hourMatch = input.match(/(\d{1,2})시/) || input.match(/(\d{1,2}):(\d{2})/);
    if (hourMatch) {
      hour = parseInt(hourMatch[1]);
    }
  }
  
  if (hour === null || hour < 0 || hour > 23) return null;
  
  // 시간대별 식사 카테고리 매핑
  return mapHourToMealType(hour);
};

/**
 * 시간(0-23)을 식사 카테고리로 매핑
 * @param hour 시간 (0-23)
 * @returns MealTimeType
 */
export const mapHourToMealType = (hour: number): MealTimeType => {
  if (hour >= 6 && hour <= 10) return '아침';      // 06:00 - 10:59
  if (hour >= 11 && hour <= 14) return '점심';     // 11:00 - 14:59
  if (hour >= 15 && hour <= 17) return '간식';     // 15:00 - 17:59
  if (hour >= 18 && hour <= 21) return '저녁';     // 18:00 - 21:59
  return '야식';                                   // 22:00 - 05:59
};

/**
 * 현재 시간을 기준으로 기본 식사 타입 추천
 * @returns MealTimeType
 */
export const getCurrentMealType = (): MealTimeType => {
  const now = new Date();
  const hour = now.getHours();
  return mapHourToMealType(hour);
};

/**
 * 식사 타입별 시간대 설명
 */
export const getMealTimeDescription = (mealType: MealTimeType): string => {
  const descriptions = {
    '아침': '오전 6시 - 11시',
    '점심': '오전 11시 - 오후 3시',
    '간식': '오후 3시 - 6시',
    '저녁': '오후 6시 - 10시',
    '야식': '오후 10시 - 새벽 6시'
  };
  return descriptions[mealType];
};

/**
 * 사용자 입력에서 시간 정보가 있는지 확인
 * @param input 사용자 입력
 * @returns boolean
 */
export const hasTimeInformation = (input: string): boolean => {
  const timeKeywords = [
    '아침', '점심', '저녁', '야식', '간식',
    '오전', '오후', '새벽', '밤',
    'breakfast', 'lunch', 'dinner', 'snack',
    '저녁', '아침', '점심', '야식', '간식'  // 중복 제거를 위해 한 번 더 추가
  ];
  
  const timePatterns = [
    /\d{1,2}시/,           // "8시", "14시"
    /\d{1,2}:\d{2}/,       // "8:30", "14:30"
    /오전\s*\d{1,2}/,      // "오전 8시", "오전 8"
    /오후\s*\d{1,2}/,      // "오후 2시", "오후 2"
    /새벽\s*\d{1,2}/,      // "새벽 3시"
    /밤\s*\d{1,2}/,        // "밤 11시"
  ];
  
  const inputLower = input.toLowerCase();
  
  // 키워드 매칭
  const hasKeyword = timeKeywords.some(keyword => 
    inputLower.includes(keyword.toLowerCase())
  );
  
  // 패턴 매칭
  const hasPattern = timePatterns.some(pattern => 
    pattern.test(input)
  );
  
  return hasKeyword || hasPattern;
}; 