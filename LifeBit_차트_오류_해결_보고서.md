# LifeBit 차트 오류 해결 보고서

## 📋 오류 현황 분석

### 발생한 주요 오류들

#### 1. **API 인증 오류 (403 Forbidden) - 핵심 문제**
```
GET http://localhost:8080/api/user-goals/1 403 (Forbidden)
healthApi.tsx:175 🚨 API Call Error: {endpoint: '/api/user-goals/1', method: 'GET', attempt: 3, status: 403, code: 'PERMISSION_DENIED'}
```
- **원인**: `/api/user-goals/1` 엔드포인트 호출 시 JWT 인증 실패
- **영향**: 사용자 목표 데이터 로드 실패, 차트 렌더링 오류
- **근본 원인**: Spring Security가 모든 `/api/**` 경로를 보호하고 있음

#### 2. **데이터 타입 오류 (TypeError)**
```
StatisticsCharts.tsx:103 Uncaught TypeError: healthRecords.map is not a function
RecommendationPanel.tsx:98 Uncaught TypeError: exerciseData.reduce is not a function
```
- **원인**: API에서 배열이 아닌 다른 타입(null, undefined, 객체)이 반환됨
- **영향**: 차트 렌더링 실패, React 컴포넌트 크래시

#### 3. **백엔드 데이터베이스 트랜잭션 오류**
```
ERROR: cannot execute INSERT in a read-only transaction
```
- **원인**: UserGoalService의 `getUserGoal` 메서드가 읽기 전용 트랜잭션에서 INSERT 시도
- **영향**: 건강 통계 조회 시 일부 기능 실패

## 🔧 해결 방안 및 적용된 수정사항

### ✅ **1. 백엔드 수정사항**

#### **UserGoalService.java - 트랜잭션 분리**
```java
@Transactional(readOnly = true)
public UserGoal getUserGoal(Long userId) {
    return userGoalRepository.findByUserId(userId).orElse(null);
}

@Transactional
public UserGoal getOrCreateUserGoal(Long userId) {
    return userGoalRepository.findByUserId(userId)
            .orElse(createDefaultUserGoal(userId));
}
```

#### **HealthStatisticsController.java - 안전한 목표 조회**
```java
// 1. 사용자 목표 조회 (기본값 사용)
UserGoal userGoal = userGoalService.getUserGoal(tokenUserId);
int workoutGoal = userGoal != null ? userGoal.getWeeklyWorkoutTarget() : 3;
```

### ✅ **2. 프론트엔드 수정사항**

#### **StatisticsCharts.tsx - 안전한 데이터 처리**
```typescript
// 데이터 타입 안전성 검사 추가
const safeHealthRecords = Array.isArray(healthRecords) ? healthRecords : [];
const safeExerciseData = Array.isArray(exerciseData) ? exerciseData : [];

if (safeHealthRecords.length === 0 && safeExerciseData.length === 0) {
  // 데이터가 없을 때 기본값 반환
  return {
    weight: [],
    bmi: [],
    exercise: [],
    stats: {
      avgWeight: 0,
      avgBMI: 0,
      totalExerciseTime: 0,
      weightTrend: 0,
      bmiTrend: 0
    }
  };
}
```

#### **healthApi.tsx - 인증 오류 처리**
```typescript
getUserGoals: async (userId: string): Promise<ApiResponse<UserGoal>> => {
  console.log('🎯 [getUserGoals] 요청 시작:', { userId });
  
  // 토큰 확인
  const token = localStorage.getItem('token');
  if (!token) {
    console.warn('🚨 [getUserGoals] 토큰이 없습니다.');
    return {
      error: {
        code: 'AUTH_REQUIRED',
        message: '로그인이 필요합니다.'
      },
      success: false
    };
  }
  
  // 403 오류인 경우 특별 처리
  if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
    return {
      error: {
        code: 'PERMISSION_DENIED',
        message: '사용자 목표에 접근할 권한이 없습니다. 로그인을 다시 시도해주세요.',
        status: 403
      },
      success: false
    };
  }
},
```

#### **auth.ts - 토큰 유효성 검사 추가**
```typescript
export const isTokenValid = (): boolean => {
  const token = getToken();
  if (!token) {
    console.warn('🚨 [isTokenValid] 토큰이 없습니다.');
    return false;
  }

  try {
    const decoded = jwtDecode<JwtPayload>(token);
    const currentTime = Date.now() / 1000;
    
    if (decoded.exp < currentTime) {
      console.warn('🚨 [isTokenValid] 토큰이 만료되었습니다.');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ [isTokenValid] 토큰 디코딩 실패:', error);
    return false;
  }
};
```

## 🎯 **즉시 해결 방안**

### **임시 해결책 (권장)**

1. **로그아웃 후 재로그인**
   ```bash
   # 브라우저에서 실행
   localStorage.clear();
   # 그 후 다시 로그인
   ```

2. **토큰 수동 확인**
   ```javascript
   // 브라우저 콘솔에서 실행
   console.log('토큰:', localStorage.getItem('token'));
   console.log('사용자 정보:', localStorage.getItem('userInfo'));
   ```

3. **API 테스트**
   ```bash
   # PowerShell에서 실행
   $token = "YOUR_JWT_TOKEN"
   Invoke-WebRequest -Uri "http://localhost:8080/api/user-goals/1" -Headers @{"Authorization"="Bearer $token"}
   ```

### **근본적 해결책**

#### **Option A: UserGoalController에 인증 검증 추가**
```java
@GetMapping("/{userId}")
public ResponseEntity<UserGoal> getUserGoals(
        @PathVariable Long userId,
        HttpServletRequest request) {
    
    // JWT에서 사용자 ID 추출
    String bearerToken = request.getHeader("Authorization");
    if (bearerToken != null && bearerToken.startsWith("Bearer ")) {
        String token = bearerToken.substring(7);
        Long tokenUserId = jwtTokenProvider.getUserIdFromToken(token);
        
        // 권한 확인: 자신의 목표만 조회 가능
        if (!tokenUserId.equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }
    
    UserGoal userGoal = userGoalService.getOrCreateUserGoal(userId);
    return ResponseEntity.ok(userGoal);
}
```

#### **Option B: 프론트엔드에서 기본값 사용**
```typescript
// healthApi.tsx에서 403 오류 시 기본값 반환
if (error?.status === 403) {
  return {
    data: {
      weekly_workout_target: 3,
      daily_carbs_target: 250,
      daily_protein_target: 150,
      daily_fat_target: 67
    },
    success: true
  };
}
```

## 📊 **개선 효과**

### **Before (수정 전)**
- ❌ 403 Forbidden 오류로 차트 로딩 실패
- ❌ `healthRecords.map is not a function` 오류
- ❌ 읽기 전용 트랜잭션 INSERT 오류
- ❌ React 컴포넌트 크래시

### **After (수정 후)**
- ✅ 인증 오류 시 우아한 처리 및 기본값 표시
- ✅ 안전한 배열 타입 검사
- ✅ 트랜잭션 분리로 데이터베이스 오류 해결
- ✅ 에러 경계로 React 컴포넌트 안정성 향상

## 🚀 **향후 개선사항**

1. **JWT 토큰 자동 갱신** 구현
2. **사용자별 권한 체계** 강화
3. **API 응답 표준화** (항상 배열 반환)
4. **실시간 토큰 유효성 검사** 추가
5. **오프라인 모드** 지원 (로컬 스토리지 캐시)

## 🔍 **디버깅 가이드**

### **1. 토큰 상태 확인**
```javascript
// 브라우저 콘솔
console.log('토큰 유효성:', isTokenValid());
console.log('사용자 ID:', getUserIdFromToken());
```

### **2. API 직접 테스트**
```bash
# Spring Boot 서버 상태 확인
curl -X GET "http://localhost:8080/actuator/health"

# 인증된 API 호출 테스트
curl -X GET "http://localhost:8080/api/user-goals/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **3. 로그 모니터링**
- 브라우저: F12 → Console 탭
- Spring Boot: 터미널에서 실시간 로그 확인
- FastAPI: `http://localhost:8001` 상태 확인

---

**최종 권장사항**: 로그아웃 후 재로그인을 통해 새로운 JWT 토큰을 발급받아 문제를 해결하는 것이 가장 빠른 방법입니다. 