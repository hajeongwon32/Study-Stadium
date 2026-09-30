# Study Stadium 협업 작업지시서

## 1. 담당 구분

| 담당 | 화면·기능 | 주요 파일 |
|---|---|---|
| HA | 로그인·회원가입 | `js/Login.js`, `js/SignUp.js`, `js/services/authService.js` |
| HA | 타이머·세트 진행 | `js/Timer.js`, `html/Timer.html`, `css/Timer.css` |
| HA | 경기 리포트·노트 팝업 | `html/Timer.html`, `css/Timer.css`, `js/Timer.js` |
| LEE | 메인 화면 | `js/studyStadium_main.js`, `html/studyStadium_main.html` |
| LEE | 통계 화면 | `js/studyStadium_stats.js`, `js/studyStadium_data.js`, `html/studyStadium_stats.html` |

## 2. 기능 및 함수

| 담당 | 기능 | 함수명 | 완료 여부 |
|---|---|---|---|
| HA | 로그인 | `signIn()` | 완료 |
| HA | 회원가입·닉네임 중복 확인 | `signUp()`, `checkNicknameDuplicate()` | 완료 |
| HA | 타이머 시작·재개 | `startTimer()` | 완료 |
| HA | 타이머 일시정지 | `pauseTimer()` | 완료 |
| HA | 세트 완료·브레이크 종료 | `finishStudySet()`, `finishBreak()` | 완료 |
| HA | 오늘은 여기까지 처리 | `finishTodayWithNote()` | 완료 |
| HA | 노트 작성·수정 | `openNoteModal()`, `saveNote()` | 완료 |
| HA | 경기 종료 화면 | `finishMatch()` | 완료 |
| HA | 타이머 진행 단계 UI 갱신 | `updateProgress()` | 완료 |
| HA | 타이머 화면·시간 표시 갱신 | `updateScreen()`, `renderTimer()`, `formatTime()` | 완료 |
| HA | 타이머 설정·모달 상태 제어 | `updateSettingAvailability()`, `closeSettingModal()`, `closeNoteModal()` | 완료 |
| HA | 세트 기록 저장·초기화 | `saveCurrentSetRecord()`, `initializeTimer()` | 완료 |
| HA | 세트·브레이크 종료 알람 | `playAlarm5Sec()` | 완료 |
| LEE | 달력 표시 | `renderCalendar()` | 완료 |
| LEE | 오늘 경기 진행률 | `updateMatchProgressUI()` | 완료 (게이지 4칸 제거, 텍스트로만 표시) |
| LEE | 타이머 화면 이동 및 시작 버튼 상태 제어 | `kickoffBtn` 클릭 이벤트 | 완료 (오늘 경기 완료 시 비활성화 포함) |
| LEE | 통계 계산·표시 | `computeStats()`, `renderStats()` | 완료 |
| LEE | 성장 단계 계산 | `getStageKey()` | 완료 |

## 3. 협업 규칙

1. 함수명은 `camelCase`로 작성하고, 함수 위에 기능 설명 주석을 작성합니다.
2. Supabase 호출은 `js/services/` 안의 서비스 함수로 분리합니다.
3. 다른 담당자의 파일이나 함수명을 수정하기 전 먼저 공유합니다.
4. 공부 기록은 `recordService.js`를 통해 저장합니다.
5. 작업이 끝나면 변경 파일과 테스트 결과를 팀원에게 알려줍니다.

## 4. 진행 상황 메모

### 최근 반영된 세부 변경 (LEE 담당 화면)

- 통계 화면 "Overview Status" → D-Day 표시로 변경 (`getStartDate()`, `getDaysSinceStart()` 추가)
- 메인 화면 Today's Match + Study Stats 섹션 통합 (기존 Study Note 섹션은 삭제)
- 캘린더 코너플래그 디자인 개선 (CSS로 더 크고 눈에 띄게 변경)
- "?" 도움말에 앱 소개 문구 추가

### 진행 중

- [ ] 데스크탑 넓은 화면 대응 반응형 CSS — 세로 비율만 넉넉하게 조정 중

### 새로 추가된 연동 (HA 파일 참고, 수정 없음)

- 메인 화면에서 `js/lib/supabaseClient.js`, `js/services/recordService.js`를 **읽기 전용으로 import**하여, 오늘 경기를 이미 끝냈는지(`is_finished`) 확인 → 끝냈으면 "경기하러 가기" 버튼 비활성화

### 공유 필요 (HA에게 꼭 전달할 것)

- [ ] `js/Login.js`의 로그인 성공 후 이동 경로를 `Timer.html` → `studyStadium_main.html`로 수정함. 협업 규칙 3번(다른 담당자 파일 수정 전 공유)과 달리 먼저 고치고 나중에 알리는 순서가 됐으니, HA에게 이 변경 사실을 꼭 전달할 것.

## 5. 커밋 규칙

```text
feat: 기능 추가
fix: 오류 수정
refactor: 구조 개선
docs: 문서 수정
```

한 커밋에는 하나의 기능만 포함합니다.
