import { supabase } from './lib/supabaseClient.js';
import { getTodayStudyRecord } from './services/recordService.js';

document.addEventListener('DOMContentLoaded', function () {

  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthLabel = document.getElementById('currentMonth');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  const matchNextTitle = document.getElementById('matchNextTitle');
  const matchNextDesc = document.getElementById('matchNextDesc');
  const matchProgressLabel = document.getElementById('matchProgressLabel');
  const kickoffBtn = document.getElementById('kickoffBtn');

  const statTotalSets = document.getElementById('statTotalSets');
  const statFocusTime = document.getElementById('statFocusTime');
  const statMatchDays = document.getElementById('statMatchDays');
  const statStreak = document.getElementById('statStreak');

  const helpBtn = document.getElementById('helpBtn');
  const helpOverlay = document.getElementById('helpOverlay');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  const helpCloseX = document.getElementById('helpCloseX');

  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsOverlay');
  const settingsCloseX = document.getElementById('settingsCloseX');
  const settingsSaveBtn = document.getElementById('settingsSaveBtn');
  const focusMinutesInput = document.getElementById('focusMinutesInput');
  const breakMinutesInput = document.getElementById('breakMinutesInput');

  // ---------- 데이터 불러오기 ----------
  let studyData = loadData();
  let settings = loadSettings();
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  // 오늘 경기를 서버(Supabase)에서 "이미 끝냄"으로 표시했는지 여부.
  // 정원이의 타이머 화면에서 "오늘의 경기 끝내기"를 누르면 여기가 true가 돼요.
  // 로그인 안 된 상태로 메인화면만 볼 때는 항상 false로 두고 기존 방식대로 동작해요.
  let todayFinishedOnServer = false;

  // ---------- 달력 그리기 ----------
  function renderCalendar() {
    calendarGrid.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay();
    const totalCells = 35;

    const todayKey = formatDateKey(new Date());

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      const dayOffset = i - startWeekday;
      const cellDate = new Date(viewYear, viewMonth, 1 + dayOffset);
      const isThisMonth = cellDate.getMonth() === viewMonth;

      if (!isThisMonth) {
        // 이번 달이 아닌 칸(지난달/다음달)은 코너플래그로 표시합니다.
        cell.classList.add('empty');
      } else {
        const dateKey = formatDateKey(cellDate);
        const record = studyData[dateKey];
        const sets = record ? record.sets : 0;
        cell.classList.add(getStageKey(sets));
        cell.dataset.date = dateKey;

        if (dateKey === todayKey) {
          cell.classList.add('today');
        }
      }

      calendarGrid.appendChild(cell);
    }

    currentMonthLabel.textContent = viewYear + '. ' + pad2(viewMonth + 1);
  }

  prevMonthBtn.addEventListener('click', function () {
    viewMonth -= 1;
    if (viewMonth < 0) { viewMonth = 11; viewYear -= 1; }
    renderCalendar();
  });
  nextMonthBtn.addEventListener('click', function () {
    viewMonth += 1;
    if (viewMonth > 11) { viewMonth = 0; viewYear += 1; }
    renderCalendar();
  });

  // ---------- 통계 미리보기 (메인 화면 하단) ----------
  function renderStatsPreview() {
    const stats = computeStats(studyData, settings);
    statTotalSets.textContent = stats.totalSets;
    statFocusTime.textContent = stats.totalTimeLabel;
    statMatchDays.textContent = stats.matchDays;
    statStreak.textContent = stats.streak;
  }

  // ---------- 오늘의 경기 진행 상황 텍스트 갱신 ----------
  function updateMatchProgressUI() {
    const todaySets = getTodayRecord(studyData).sets;
    matchProgressLabel.textContent = todaySets + ' / ' + MAX_SETS + ' SETS';
  }

  // ---------- 안내 문구(NEXT) + 경기하러 가기 버튼 상태 갱신 ----------
  function updateNextInfoUI() {
    const todaySets = getTodayRecord(studyData).sets;
    const timerStatus = loadTimerStatus();

    if (todayFinishedOnServer || todaySets >= MAX_SETS) {
      matchNextTitle.textContent = '오늘 경기 종료 (FULL TIME)';
      matchNextDesc.textContent = '오늘의 공부를 마쳤어요. 내일 또 만나요!';
      kickoffBtn.disabled = true;
      kickoffBtn.textContent = '오늘 완료';
    } else if (timerStatus.phase === 'focus') {
      matchNextTitle.textContent = '집중 중 (진행 중)';
      matchNextDesc.textContent = '타이머 화면에서 집중하고 있어요. 화이팅!';
      kickoffBtn.disabled = true;
      kickoffBtn.textContent = '경기 진행 중';
    } else if (timerStatus.phase === 'break') {
      matchNextTitle.textContent = '브레이크 타임';
      matchNextDesc.textContent = '잠깐 쉬는 중이에요. 곧 다음 세트가 시작돼요.';
      kickoffBtn.disabled = true;
      kickoffBtn.textContent = '경기 진행 중';
    } else {
      matchNextTitle.textContent = '킥오프 준비 완료';
      matchNextDesc.textContent = '버튼을 눌러 오늘의 경기를 시작해보세요';
      kickoffBtn.disabled = false;
      kickoffBtn.textContent = '경기하러 가기';
    }
  }

  // ---------- 오늘 경기가 서버에서 이미 끝났는지 확인 ----------
  // 정원이 코드(getTodayStudyRecord)를 그대로 가져다 씁니다. 이 함수는 고치지 않아요.
  function checkTodayFinishedOnServer() {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;

      if (!session) {
        // 로그인 안 되어 있으면 그냥 기존 방식(로컬 세트 수 기준)대로 동작합니다.
        todayFinishedOnServer = false;
        updateNextInfoUI();
        return;
      }

      getTodayStudyRecord(session.user.id).then(function (record) {
        todayFinishedOnServer = Boolean(record && record.is_finished);
        updateNextInfoUI();
      }).catch(function (error) {
        console.error('오늘 완료 여부 확인 실패:', error);
      });
    }).catch(function (error) {
      console.error('로그인 상태 확인 실패:', error);
    });
  }

  // ---------- 경기하러 가기 버튼 ----------
  kickoffBtn.addEventListener('click', function () {
    if (kickoffBtn.disabled) return;
    window.location.href = 'timer.html';
  });

  // ---------- 실시간 상태 갱신 (로컬 데이터, 1초마다) ----------
  setInterval(function () {
    studyData = loadData();
    renderCalendar();
    renderStatsPreview();
    updateMatchProgressUI();
    updateNextInfoUI();
  }, 1000);

  // ---------- 오늘 경기 완료 여부 갱신 (서버에 물어보는 거라 5초마다) ----------
  setInterval(checkTodayFinishedOnServer, 5000);

  // ---------- 도움말 팝업 ----------
  function openHelp() { helpOverlay.hidden = false; }
  function closeHelp() { helpOverlay.hidden = true; }

  helpBtn.addEventListener('click', openHelp);
  helpCloseBtn.addEventListener('click', closeHelp);
  helpCloseX.addEventListener('click', closeHelp);
  helpOverlay.addEventListener('click', function (e) {
    if (e.target === helpOverlay) closeHelp();
  });

  // ---------- 집중/휴식 시간 설정 팝업 ----------
  function openSettings() {
    focusMinutesInput.value = settings.focusMinutes;
    breakMinutesInput.value = settings.breakMinutes;
    settingsOverlay.hidden = false;
  }
  function closeSettings() { settingsOverlay.hidden = true; }

  function saveSettingsFromInputs() {
    let focusMinutes = Number(focusMinutesInput.value);
    let breakMinutes = Number(breakMinutesInput.value);

    if (!focusMinutes || focusMinutes < 1) focusMinutes = DEFAULT_FOCUS_MINUTES;
    if (!breakMinutes || breakMinutes < 1) breakMinutes = DEFAULT_BREAK_MINUTES;

    settings = { focusMinutes: focusMinutes, breakMinutes: breakMinutes };
    saveSettings(settings);

    updateNextInfoUI();
    closeSettings();
  }

  settingsBtn.addEventListener('click', openSettings);
  settingsCloseX.addEventListener('click', closeSettings);
  settingsOverlay.addEventListener('click', function (e) {
    if (e.target === settingsOverlay) closeSettings();
  });
  settingsSaveBtn.addEventListener('click', saveSettingsFromInputs);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !helpOverlay.hidden) closeHelp();
    if (e.key === 'Escape' && !settingsOverlay.hidden) closeSettings();
  });

  renderCalendar();
  renderStatsPreview();
  updateMatchProgressUI();
  updateNextInfoUI();
  checkTodayFinishedOnServer();
});