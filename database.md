# 데이터베이스 설계 명세서

## 사용자

### Authentication - Users (Supabase Auth)
*(Supabase에 내장된 인증 시스템으로, 별도 생성 없이 자동 관리됨)*

| 속성명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY | 사용자 고유 ID (UID) |
| **email** | VARCHAR(255) | UNIQUE, NOT NULL | 사용자 이메일 계정 |
| **created_at** | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 회원가입 일시 |

---

## 공부 기록

### study_records (공부 기록)

| 속성명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 공부 기록 고유 ID |
| **created_at** | TIMESTAMPTZ | DEFAULT CURRENT_TIMESTAMP | 기록 생성 일시 |
| **user_id** | UUID | FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE | 기록 작성자 ID |
| **date** | TEXT | UNIQUE, NOT NULL | 공부 날짜 (예: '2026-09-17') |
| **sets** | INTEGER | DEFAULT 0 | 완료한 뽀모도로 세트 수 (0~4) |
| **total_time** | INTEGER | DEFAULT 0 | 총 공부 시간 (분 단위) |
| **note** | TEXT | NULLABLE | MATCH REPORT 공부 일지 메모 |