# Database Specification (Supabase)

## 1. profiles (사용자 프로필)
회원가입 시 가상 이메일 기반 Auth 계정과 매핑되어 유저의 닉네임을 관리하는 테이블입니다.

| 컬럼명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | UUID | PRIMARY KEY, REFERENCES auth.users(id) ON DELETE CASCADE (기본값 없음) | 사용자 고유 ID (auth.users.id 그대로 사용) |
| **nickname** | TEXT | UNIQUE, NOT NULL | 선수 이름 (닉네임) |

- 회원가입 시 트리거 `handle_new_user`가 `raw_user_meta_data.nickname`으로 행을 자동 생성합니다.
  → `supabase.auth.signUp`에 `options.data.nickname` 필수. 닉네임이 중복이면 가입 자체가 실패합니다.
- RLS: SELECT는 anon 포함 전체 공개, UPDATE는 본인(`auth.uid() = id`)만 가능.

---

## 2. study_records (공부 기록 및 잔디)
타이머 측정 결과(뽀모도로 세트, 총 공부 시간) 및 MATCH REPORT 일지 메모를 저장하는 테이블입니다.

| 컬럼명 | 자료형 | 제약 조건 | 설명 |
| :--- | :--- | :--- | :--- |
| **id** | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 공부 기록 고유 ID |
| **user_id** | UUID | NOT NULL, DEFAULT auth.uid(), FOREIGN KEY REFERENCES auth.users(id) ON DELETE CASCADE | 기록 작성자 ID (insert 시 생략 가능) |
| **date** | DATE | NOT NULL | 공부 날짜 (예: '2026-09-21') |
| **sets** | INTEGER | NOT NULL, DEFAULT 0, CHECK (sets >= 0) | 완료한 뽀모도로 세트 수 (0 = 흙, 1~4 = 잔디 레벨) |
| **total_time** | INTEGER | NOT NULL, DEFAULT 0, CHECK (total_time >= 0) | 총 공부 시간 (분 단위) |
| **note** | TEXT | NULL 허용, 기본값 없음 | MATCH REPORT 공부 일지 메모 (세트 저장 시 생략 가능) |
| **is_finished** | BOOLEAN | NOT NULL, DEFAULT FALSE | 오늘 공부를 사용자가 종료했는지 여부 |

- **UNIQUE (user_id, date)**: 사용자당 하루 1행. upsert 시 `onConflict: 'user_id,date'`.
- RLS: 본인 행만 전체 접근 가능 (`auth.uid() = user_id`).
- `date`는 반드시 로컬 기준 `YYYY-MM-DD` 문자열로 보냅니다. `toISOString()`은 UTC라 한국 시간 오전 9시 전에 하루가 밀리므로 사용 금지.
  오늘 날짜: `new Date().toLocaleDateString('sv-SE')` (또는 `recordService.js`의 `getDateKey()`).

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
                     └─ date (DATE)
                     └─ sets (INTEGER)
                     └─ total_time (INTEGER)
                     └─ note (TEXT)
                     └─ is_finished (BOOLEAN)