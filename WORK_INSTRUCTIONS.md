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
| LEE | 달력 표시 | `renderCalendar()` |  |
| LEE | 오늘 경기 진행률 | `updateMatchProgressUI()` |  |
| LEE | 타이머 화면 이동 및 시작 버튼 상태 제어 | `kickoffBtn` 클릭 이벤트 |  |
| LEE | 통계 계산·표시 | `computeStats()`, `renderStats()` |  |
| LEE | 성장 단계 계산 | `getStageKey()` |  |

## 3. 협업 규칙

1. 함수명은 `camelCase`로 작성하고, 함수 위에 기능 설명 주석을 작성합니다.
2. Supabase 호출은 `js/services/` 안의 서비스 함수로 분리합니다.
3. 다른 담당자의 파일이나 함수명을 수정하기 전 먼저 공유합니다.
4. 공부 기록은 `recordService.js`를 통해 저장합니다.
5. 작업이 끝나면 변경 파일과 테스트 결과를 팀원에게 알려줍니다.

## 4. 커밋 규칙

```text
feat: 기능 추가
fix: 오류 수정
refactor: 구조 개선
docs: 문서 수정
```

한 커밋에는 하나의 기능만 포함합니다.