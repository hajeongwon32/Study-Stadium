# Database Specification (Supabase)

## 1. profiles (사용자 프로필)
회원가입 시 가상 이메일 기반 Auth 계정과 매핑되어 유저의 닉네임을 관리하는 테이블입니다.

| 컬럼명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE | 사용자 고유 ID (Auth 계정과 1:1) |
| **nickname** | TEXT | UNIQUE, NOT NULL | 선수 이름 (닉네임) |

---

## 2. study_records (공부 기록 및 잔디)
타이머 측정 결과(뽀모도로 세트, 총 공부 시간) 및 MATCH REPORT 일지 메모를 저장하는 테이블입니다.

| 컬럼명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 공부 기록 고유 ID |
| **created_at** | TIMESTAMPTZ | DEFAULT NOW() | 기록 생성 일시 |
| **user_id** | UUID | FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE | 기록 작성자 ID |
| **date** | TEXT | UNIQUE, NOT NULL | 공부 날짜 (예: '2026-09-21') |
| **sets** | INTEGER | DEFAULT 0 | 완료한 뽀모도로 세트 수 (0 = 흙, 1~4 = 잔디 레벨) |
| **total_time** | INTEGER | DEFAULT 0 | 총 공부 시간 (분 단위) |
| **note** | TEXT | NULLABLE | MATCH REPORT 공부 일지 메모 |

---

## 3. 테이블 연동 구조 (ERD 요약)

```text
[ auth.users ]
     │
     ├── (1:1) ───> [ profiles ]
     │               └─ id (UUID)
     │               └─ nickname (TEXT)
     │
     └── (1:N) ───> [ study_records ]
                     └─ id (BIGINT)
                     └─ user_id (UUID)
                     └─ date (TEXT)
                     └─ sets (INTEGER)
                     └─ total_time (INTEGER)
                     └─ note (TEXT)