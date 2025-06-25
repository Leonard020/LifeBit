-- ===================================================================
-- Notification(알림) 테이블 생성 및 연동 SQL (LifeBit 프로젝트용)
-- ===================================================================

-- 알림 테이블 생성
CREATE TABLE notification (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE, -- 알림 대상 사용자
    type VARCHAR(50),           -- 알림 유형 (예: 'RANKING', 'ACHIEVEMENT', 'EXERCISE', 'SYSTEM' 등)
    ref_id BIGINT,              -- 관련 데이터의 id (예: user_ranking.id, user_achievements.id 등, 필요시)
    title VARCHAR(255) NOT NULL, -- 알림 제목
    message TEXT NOT NULL,      -- 알림 상세 메시지
    is_read BOOLEAN DEFAULT FALSE, -- 읽음 여부
    created_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 생성 (조회 성능 향상)
CREATE INDEX idx_notification_user_id ON notification(user_id);
CREATE INDEX idx_notification_type ON notification(type);

-- ===================================================================
-- 예시: 알림 데이터 삽입 (테스트용)
-- ===================================================================
-- 실제 user_id, ref_id 값은 운영 DB 상황에 맞게 조정 필요

INSERT INTO notification (user_id, type, ref_id, title, message)
VALUES
  (1, 'RANKING', 1, '등급 승급', '실버 등급으로 승급하셨습니다!'),
  (2, 'ACHIEVEMENT', 3, '업적 달성', '연속 7일 운동 업적을 달성했습니다!'),
  (1, 'EXERCISE', 10, '운동 목표 달성', '주간 운동 목표를 달성하셨습니다!'),
  (2, 'SYSTEM', NULL, '시스템 점검 안내', '6월 30일 02:00~04:00 시스템 점검이 예정되어 있습니다.');

-- ===================================================================
-- 알림 테이블 조회 예시
-- ===================================================================
-- SELECT * FROM notification WHERE user_id = 1 ORDER BY created_at DESC; 