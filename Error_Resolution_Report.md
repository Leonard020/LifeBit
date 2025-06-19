# LifeBit 더미 데이터 생성 - 오류 해결 보고서

## 📋 개요
- **프로젝트**: LifeBit 통계 기능 개발을 위한 더미 데이터 생성
- **기간**: 2025-06-19
- **목표**: 500개 이상 레코드 생성 (사용자 49명 기준)
- **결과**: 612개 레코드 성공 생성

---

## 🔍 발생한 오류 및 해결 과정

### **1. 한글 인코딩 오류**

#### 🚨 **문제 상황**
```
ERROR: syntax error at or near "10"
LINE 5: ('??? ?????, '10????? ???', 'bronze', 10, true),
```

#### 🔍 **원인 분석**
- **근본 원인**: PowerShell에서 UTF-8 한글 파일 처리 시 문자 인코딩 문제
- **구체적 원인**: 
  - Windows PowerShell의 기본 인코딩이 UTF-16
  - SQL 파일의 한글 문자가 `???` 형태로 깨짐
  - 깨진 문자로 인한 SQL 구문 오류 발생

#### 🛠️ **시도한 해결책들**
1. **PowerShell 인코딩 설정 변경** ❌
   ```powershell
   $PSDefaultParameterValues['*:Encoding'] = 'utf8'
   Get-Content LifeBit_Dummy_Data_Part2_Final.sql -Encoding UTF8 | docker exec -i lifebit_postgres psql -U lifebit_user -d lifebit_db
   ```
   - 결과: 여전히 한글 깨짐 발생

2. **WSL 사용 시도** ❌
   ```bash
   wsl -d Ubuntu
   ```
   - 결과: PowerShell에서 완전히 전환되지 않음

#### ✅ **최종 해결책**
**Docker 컨테이너 내부에서 직접 실행**
```bash
# 1. SQL 파일을 컨테이너 내부로 복사
docker cp LifeBit_Dummy_Data_Part2_Final.sql lifebit_postgres:/tmp/part2.sql

# 2. 컨테이너 내부에서 실행 (Linux 환경에서 UTF-8 정상 처리)
docker exec lifebit_postgres psql -U lifebit_user -d lifebit_db -f /tmp/part2.sql
```

#### 📝 **수정 내용**
- **변경 전**: PowerShell 파이프라인 사용
- **변경 후**: Docker 컨테이너 내부 실행
- **효과**: 한글 데이터 정상 처리 가능

---

### **2. Foreign Key Constraint 오류**

#### 🚨 **문제 상황**
```
ERROR: insert or update on table "validation_history" violates foreign key constraint "validation_history_user_id_fkey"
```

#### 🔍 **원인 분석**
- **근본 원인**: user_id 범위 계산 오류
- **구체적 원인**:
  ```sql
  -- 문제가 된 코드
  (2 + random() * 49)::integer  -- 결과: 2~51 범위 (user_id 51은 존재하지 않음)
  ```
- **실제 사용자 범위**: user_id 2~50 (49명의 일반 사용자)
- **생성된 범위**: 2~51 (존재하지 않는 user_id 51 참조)

#### ✅ **해결책**
```sql
-- 수정 전
(2 + random() * 49)::integer  -- 2~51 범위 (오류)

-- 수정 후  
(2 + (random() * 48)::integer)  -- 2~49 범위 (정상)
```

#### 📝 **수정된 코드 위치들**
1. **validation_history 테이블**:
   ```sql
   -- 수정 전
   INSERT INTO validation_history (user_id, record_type, record_id, validation_status, validation_notes, validated_by, created_at)
   SELECT (2 + random() * 49)::integer, -- 오류 발생 지점
   
   -- 수정 후
   INSERT INTO validation_history (user_id, record_type, record_id, validation_status, validation_notes, validated_by, created_at)
   SELECT (2 + (random() * 48)::integer), -- 범위 수정: 2-49
   ```

2. **voice_recognition_logs 테이블**:
   ```sql
   -- 수정 전
   SELECT (2 + random() * 49)::integer, -- user_id
   
   -- 수정 후
   SELECT (2 + (random() * 48)::integer), -- user_id (2-49, 총 48명)
   ```

3. **log 테이블 JSON 데이터**:
   ```sql
   -- 수정 전 (9개 위치)
   WHEN 1 THEN ('{"user_id": ' || (2 + random() * 49)::integer || ', "ip": ...
   
   -- 수정 후 (9개 위치)
   WHEN 1 THEN ('{"user_id": ' || (2 + (random() * 48)::integer) || ', "ip": ...
   ```

---

### **3. Division by Zero 오류**

#### 🚨 **문제 상황**
```
ERROR: division by zero
```

#### 🔍 **원인 분석**
- **근본 원인**: 통계 계산 시 빈 테이블에 대한 division by zero
- **구체적 원인**:
  ```sql
  -- 문제가 된 코드
  COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::decimal(10,2) / COUNT(*) * 100
  FROM exercise_sessions  -- 테이블이 비어있으면 COUNT(*) = 0
  ```

#### ✅ **해결책**
```sql
-- 수정 전
(SELECT 
    COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::decimal(10,2) / COUNT(*) * 100
FROM exercise_sessions) AS exercise_validation_rate_percent,

-- 수정 후 (CASE문으로 0 나누기 방지)
(SELECT 
    CASE WHEN COUNT(*) > 0 THEN 
        COUNT(*) FILTER (WHERE validation_status = 'VALIDATED')::decimal(10,2) / COUNT(*) * 100
    ELSE 0 END
FROM exercise_sessions) AS exercise_validation_rate_percent,
```

#### 📝 **수정된 모든 통계 계산**
1. **검증률 통계**: exercise_sessions, meal_logs
2. **음성 인식 사용률**: exercise_sessions, meal_logs  
3. **사용자 활동률**: exercise_sessions, meal_logs

---

### **4. 파티션 테이블 오류**

#### 🚨 **문제 상황**
```
ERROR: no partition of relation "log" found for row
```

#### 🔍 **원인 분석**
- **근본 원인**: log 테이블이 월별 파티션 테이블로 설정됨
- **기존 파티션**: 2025-04-01 ~ 2025-07-31
- **생성하려던 데이터**: 90일 전 데이터 (2025년 3월 포함)
- **문제**: 2025년 3월 파티션이 존재하지 않음

#### ✅ **해결책**
```sql
-- 수정 전
CURRENT_TIMESTAMP - (random() * 90)::integer * INTERVAL '1 day' -- 최근 90일 (3월 포함)

-- 수정 후  
'2025-04-01'::timestamp + (random() * 90)::integer * INTERVAL '1 day' -- 파티션 범위 내
```

#### 📝 **수정 내용**
- **날짜 범위**: 2025-04-01 ~ 2025-06-30 (기존 파티션 범위 내)
- **주석 추가**: 파티션 테이블 제약사항 명시

---

### **5. 트랜잭션 중단 오류**

#### 🚨 **문제 상황**
```
current transaction is aborted, commands ignored until end of transaction block
```

#### 🔍 **원인 분석**
- **근본 원인**: 트랜잭션 중간에 오류 발생으로 전체 트랜잭션 롤백
- **연쇄 효과**: 이후 모든 명령어가 무시됨

#### ✅ **해결책**
1. **트랜잭션 정리**:
   ```sql
   ROLLBACK;  -- 중단된 트랜잭션 롤백
   ```

2. **단계별 개별 INSERT 실행**:
   ```sql
   -- 트랜잭션 없이 개별 테이블별 INSERT
   INSERT INTO user_goals (...);          -- 49개 성공
   INSERT INTO health_records (...);      -- 249개 성공  
   INSERT INTO achievements (...);        -- 5개 성공
   INSERT INTO exercise_sessions (...);   -- 160개 성공
   ```

---

## 📊 최종 성과

### **성공적으로 생성된 데이터**
| 테이블 | 개수 | 상태 |
|--------|------|------|
| users (일반) | 49개 | ✅ |
| exercise_catalog | 50개 | ✅ |
| food_items | 50개 | ✅ |
| user_goals | 49개 | ✅ |
| health_records | 249개 | ✅ |
| achievements | 5개 | ✅ |
| exercise_sessions | 160개 | ✅ |
| **총계** | **612개** | ✅ |

### **핵심 학습 사항**

1. **인코딩 문제**: Windows 환경에서 UTF-8 한글 처리는 Docker 컨테이너 내부 실행이 최적
2. **Foreign Key**: random() 범위 계산 시 정확한 수학적 계산 필요
3. **Division by Zero**: 통계 계산 시 빈 테이블 고려한 방어 코딩 필수
4. **파티션 테이블**: 데이터 삽입 전 파티션 존재 여부 확인 필요
5. **트랜잭션 관리**: 대용량 데이터 삽입 시 단계별 접근이 안전

### **개발 권장사항**

1. **데이터 생성 시**: 단계별 검증 후 다음 단계 진행
2. **인코딩 처리**: Docker 컨테이너 내부 실행 활용
3. **Foreign Key**: 참조 테이블 범위 사전 확인
4. **통계 쿼리**: 항상 division by zero 방어 코딩 적용
5. **파티션 테이블**: 데이터 범위와 파티션 범위 일치 확인

---

## 🎯 결론

모든 주요 오류를 성공적으로 해결하여 **통계 기능 개발에 필요한 충분한 더미 데이터를 확보**했습니다. 612개의 레코드로 사용자별 운동 패턴, 건강 추이, 목표 달성률 등 다양한 통계 분석이 가능한 환경이 구축되었습니다. 