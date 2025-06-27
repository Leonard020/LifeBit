// 영양정보 계산 유틸리티 함수들
import { getToken } from '@/utils/auth';
import { normalizeKoreanAmount } from './koreanAmountNormalizer';

// 영양정보 데이터 타입
export interface NutritionData {
  serving_size?: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

// FoodItem 생성 요청 타입
export interface FoodItemCreateRequest {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

// FoodItem 응답 타입
export interface FoodItemResponse {
  foodItemId: number;
  name: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

/**
 * GPT를 사용하여 음식의 영양정보를 계산합니다.
 * @param foodName 음식명
 * @param retryCount 재시도 횟수
 * @returns 영양정보 데이터
 */
export const calculateNutritionFromGPT = async (foodName: string, retryCount = 0): Promise<NutritionData> => {
  const maxRetries = 2;
  
  try {
    console.log(`🔍 [GPT 영양정보 계산] 시작 (시도: ${retryCount + 1}/${maxRetries + 1}):`, foodName);
    
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API 키가 설정되지 않았습니다. .env 파일에 VITE_OPENAI_API_KEY를 설정해주세요.');
    }
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `당신은 영양 전문가입니다. 음식의 영양성분을 정확하게 계산해주세요.
응답은 반드시 다음과 같은 JSON 형식으로만 해주세요:
{
  "serving_size": 100,
  "calories": 숫자,
  "carbs": 숫자,
  "protein": 숫자,
  "fat": 숫자
}

- serving_size는 항상 100g 기준으로 설정
- 모든 영양성분은 100g당 수치로 계산
- 숫자만 입력하고 단위는 포함하지 마세요
- 다른 설명이나 텍스트는 포함하지 마세요`
          },
          {
            role: 'user',
            content: `${foodName}의 100g당 영양성분을 알려주세요.`
          }
        ],
        max_tokens: 150,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('OpenAI API 응답에서 content를 찾을 수 없습니다.');
    }

    const content = data.choices[0].message.content.trim();
    console.log('🤖 [GPT 원본 응답]:', content);
    
    let nutritionData: NutritionData;
    try {
      nutritionData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON 파싱 오류:', parseError);
      throw new Error('GPT 응답을 JSON으로 파싱할 수 없습니다.');
    }

    // 필수 필드 검증
    const requiredFields = ['calories', 'carbs', 'protein', 'fat'];
    for (const field of requiredFields) {
      if (typeof nutritionData[field as keyof NutritionData] !== 'number') {
        throw new Error(`필수 영양성분 정보가 누락되었습니다: ${field}`);
      }
    }

    // serving_size 기본값 설정
    if (!nutritionData.serving_size) {
      nutritionData.serving_size = 100;
    }

    console.log('✅ [GPT 영양정보 계산] 성공:', nutritionData);
    return nutritionData;
    
  } catch (error) {
    console.error(`❌ [GPT 영양정보 계산] 실패 (시도: ${retryCount + 1}):`, error);
    
    // 재시도 조건 확인
    if (retryCount < maxRetries) {
      console.log(`🔄 [GPT 영양정보 계산] 재시도 중... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return calculateNutritionFromGPT(foodName, retryCount + 1);
    }
    
    // 최대 재시도 횟수 초과 시 기본값 반환
    console.log('⚠️ [GPT 영양정보 계산] 기본값 사용');
    return {
      serving_size: 100,
      calories: 200,
      carbs: 20,
      protein: 10,
      fat: 5,
    };
  }
};

/**
 * Spring Boot API를 사용하여 DB에 음식을 생성합니다.
 * @param foodName 음식명
 * @param nutritionData 영양정보
 * @param retryCount 재시도 횟수
 * @returns 생성된 FoodItem의 ID
 */
export const createFoodItemInDB = async (foodName: string, nutritionData: NutritionData, retryCount = 0): Promise<number | null> => {
  const maxRetries = 2;
  
  try {
    console.log(`💾 [DB 음식 생성] 시작 (시도: ${retryCount + 1}/${maxRetries + 1}):`, foodName);
    
    const token = getToken();
    if (!token) {
      throw new Error('인증 토큰이 없습니다.');
    }
    
    const requestData: FoodItemCreateRequest = {
      name: foodName,
      serving_size: nutritionData.serving_size || 100.0,
      calories: Number(nutritionData.calories.toFixed(2)),
      carbs: Number(nutritionData.carbs.toFixed(2)),
      protein: Number(nutritionData.protein.toFixed(2)),
      fat: Number(nutritionData.fat.toFixed(2))
    };
    
    console.log('📝 [DB 요청 데이터]:', requestData);
    
    const response = await fetch('/api/meals/foods/find-or-create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Spring Boot API 오류: ${response.status} - ${errorText}`);
    }

    const data: FoodItemResponse = await response.json();
    console.log('💾 [DB 음식 생성] 성공:', data);
    
    return data.foodItemId;
  } catch (error) {
    console.error(`💾 [DB 음식 생성] 실패 (시도: ${retryCount + 1}):`, error);
    
    // 재시도 횟수가 남아있고 네트워크 오류인 경우만 재시도
    if (retryCount < maxRetries && (error instanceof Error && 
        (error.message.includes('Failed to fetch') || 
         error.message.includes('ERR_CONNECTION_REFUSED') ||
         error.message.includes('Network Error')))) {
      console.log(`🔄 [DB 음식 생성] 재시도 중... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
      return createFoodItemInDB(foodName, nutritionData, retryCount + 1);
    }
    
    // 최대 재시도 횟수 초과 또는 재시도 불가능한 오류
    console.log('❌ [DB 음식 생성] 재시도 중단');
    return null;
  }
};

/**
 * GPT + Spring Boot 통합 음식 생성 함수
 * @param foodName 음식명
 * @param retryCount 재시도 횟수
 * @returns 생성된 FoodItem의 ID
 */
export const createFoodItemFromGPT = async (foodName: string, retryCount = 0): Promise<number | null> => {
  const maxRetries = 2;
  
  try {
    console.log(`🎯 [통합 음식 생성] 시작 (시도: ${retryCount + 1}/${maxRetries + 1}):`, foodName);
    
    // 1단계: GPT로 영양정보 계산
    const nutritionData = await calculateNutritionFromGPT(foodName);
    
    // 2단계: Spring Boot API로 DB에 음식 생성
    const foodItemId = await createFoodItemInDB(foodName, nutritionData);
    
    if (foodItemId) {
      console.log('🎉 [통합 음식 생성] 성공:', { foodName, foodItemId, nutritionData });
      return foodItemId;
    } else {
      throw new Error('DB 저장 실패');
    }
  } catch (error) {
    console.error(`❌ [통합 음식 생성] 실패 (시도: ${retryCount + 1}):`, error);
    
    // 재시도 횟수가 남아있으면 재시도
    if (retryCount < maxRetries) {
      console.log(`🔄 [통합 음식 생성] 재시도 중... (${retryCount + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
      return createFoodItemFromGPT(foodName, retryCount + 1);
    }
    
    // 최대 재시도 횟수 초과
    console.log('❌ [통합 음식 생성] 최대 재시도 횟수 초과');
    return null;
  }
};

/**
 * Converts a user-entered amount string (e.g., '1개', '2공기', '100g') to grams.
 * Uses food-specific logic for common foods.
 */
export function parseAmountToGrams(amount: string, foodName?: string): number {
  if (!amount) return 100;
  
  const num = parseFloat(amount.replace(/[^0-9.]/g, '')) || 1;
  const lower = amount.toLowerCase();
  const foodLower = foodName?.toLowerCase() || '';
  
  // Direct gram measurements
  if (lower.includes('g') || lower.includes('그램')) return num;
  
  // Korean food measurements
  if (lower.includes('공기') || lower.includes('그릇')) {
    if (foodLower.includes('밥') || foodLower.includes('쌀')) return num * 210;
    if (foodLower.includes('국') || foodLower.includes('탕') || foodLower.includes('찌개')) return num * 350;
    if (foodLower.includes('면') || foodLower.includes('라면') || foodLower.includes('스파게티')) return num * 300;
    return num * 300; // default for 그릇
  }
  
  if (lower.includes('컵') || lower.includes('잔')) {
    if (foodLower.includes('우유') || foodLower.includes('물') || foodLower.includes('주스')) return num * 240;
    if (foodLower.includes('쌀') || foodLower.includes('밥')) return num * 180;
    return num * 240; // default for 컵
  }
  
  if (lower.includes('접시') || lower.includes('판')) {
    if (foodLower.includes('김밥') || foodLower.includes('초밥')) return num * 200;
    if (foodLower.includes('샐러드')) return num * 150;
    return num * 250; // default for 접시
  }
  
  if (lower.includes('장') || lower.includes('개')) {
    if (foodLower.includes('계란')) return num * 60;
    if (foodLower.includes('사과')) return num * 200;
    if (foodLower.includes('바나나')) return num * 120;
    if (foodLower.includes('오렌지')) return num * 150;
    if (foodLower.includes('토마토')) return num * 100;
    if (foodLower.includes('햄버거')) return num * 200;
    if (foodLower.includes('피자')) return num * 300;
    if (foodLower.includes('샌드위치')) return num * 150;
    if (foodLower.includes('도넛')) return num * 80;
    if (foodLower.includes('케이크')) return num * 100;
    if (foodLower.includes('빵') || foodLower.includes('토스트')) return num * 100;
    if (foodLower.includes('김밥')) return num * 200;
    if (foodLower.includes('초밥')) return num * 30;
    return num * 100; // fallback for unknown '개'
  }
  
  if (lower.includes('조각') || lower.includes('쪽')) {
    if (foodLower.includes('피자')) return num * 150;
    if (foodLower.includes('케이크')) return num * 80;
    if (foodLower.includes('빵')) return num * 50;
    return num * 75; // default for 조각
  }
  
  if (lower.includes('스푼') || lower.includes('숟가락')) {
    if (foodLower.includes('설탕') || foodLower.includes('소금')) return num * 5;
    if (foodLower.includes('올리브유') || foodLower.includes('기름')) return num * 15;
    return num * 10; // default for 스푼
  }
  
  if (lower.includes('큰술') || lower.includes('테이블스푼')) {
    if (foodLower.includes('설탕') || foodLower.includes('소금')) return num * 15;
    if (foodLower.includes('올리브유') || foodLower.includes('기름')) return num * 15;
    return num * 15; // default for 큰술
  }
  
  if (lower.includes('작은술') || lower.includes('티스푼')) {
    if (foodLower.includes('설탕') || foodLower.includes('소금')) return num * 5;
    if (foodLower.includes('올리브유') || foodLower.includes('기름')) return num * 5;
    return num * 5; // default for 작은술
  }
  
  if (lower.includes('포기') || lower.includes('송이')) {
    if (foodLower.includes('상추') || foodLower.includes('양상추')) return num * 50;
    if (foodLower.includes('배추')) return num * 800;
    return num * 100; // default for 포기/송이
  }
  
  if (lower.includes('개') || lower.includes('알')) {
    // Handle cases without specific food context
    return num * 100; // conservative default
  }
  
  // If no specific pattern matches, assume it's a number of grams
  if (!isNaN(num)) {
    return num;
  }
  
  // Final fallback
  return 100;
}

/**
 * Uses GPT to estimate the gram value for a given food and amount string.
 * Returns a number (grams). Falls back to parseAmountToGrams if GPT fails.
 */
export async function estimateGramsWithGPT(foodName: string, amount: string): Promise<number> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      console.log('[AMOUNT ESTIMATE] No API key, using fallback');
      return parseAmountToGrams(amount, foodName);
    }

    // Normalize amount
    const normalizedAmount = normalizeKoreanAmount(amount);
    console.log('[AMOUNT ESTIMATE][NORMALIZED]:', normalizedAmount);

    // If amount is a pure number or contains 'g'/'그램', use rule-based
    const isNumeric = /^\d+(\.\d+)?$/.test(normalizedAmount.trim());
    const isGram = normalizedAmount.includes('g') || normalizedAmount.includes('그램');
    if (isNumeric || isGram) {
      return parseAmountToGrams(normalizedAmount, foodName);
    }

    // Otherwise, always ask GPT
    const prompt = `한국 음식 전문가로서, '${foodName} ${normalizedAmount}'의 일반적인 1회 제공량(그램)을 알려주세요. 숫자만 답변하세요.`;
    console.log('[AMOUNT ESTIMATE][GPT PROMPT]:', prompt);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 50,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    console.log('[AMOUNT ESTIMATE][GPT RESPONSE]:', content);
    if (!content) {
      throw new Error('No content in GPT response');
    }

    // Extract number from response
    const numberMatch = content.match(/\d+(?:\.\d+)?/);
    let grams = numberMatch ? parseFloat(numberMatch[0]) : NaN;

    // Sanity fallback for suspiciously low values
    if (isNaN(grams) || grams < 30) {
      console.warn(`[AMOUNT ESTIMATE][FALLBACK]: GPT returned ${grams}g for '${foodName} ${normalizedAmount}', using fallback.`);
      if (foodName.includes('국') || foodName.includes('탕') || foodName.includes('찌개')) {
        grams = 350; // typical soup serving
      } else {
        grams = 100; // generic fallback
      }
    }

    return grams;
  } catch (error) {
    console.error(`[AMOUNT ESTIMATE] GPT estimation failed: ${error}`);
    return parseAmountToGrams(amount, foodName);
  }
} 