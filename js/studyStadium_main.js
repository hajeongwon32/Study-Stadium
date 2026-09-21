document.addEventListener('DOMContentLoaded', function () {

  const calendarGrid = document.getElementById('calendarGrid');
  const currentMonthLabel = document.getElementById('currentMonth');
  const prevMonthBtn = document.getElementById('prevMonthBtn');
  const nextMonthBtn = document.getElementById('nextMonthBtn');

  const matchNextTitle = document.getElementById('matchNextTitle');
  const matchNextDesc = document.getElementById('matchNextDesc');
  const matchProgressLabel = document.getElementById('matchProgressLabel');
  const setSegments = document.querySelectorAll('.set-segment');
  const kickoffBtn = document.getElementById('kickoffBtn');

  const studyNote = document.getElementById('studyNote');
  const saveNoteBtn = document.getElementById('saveNoteBtn');

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
  let settings = loadSettings();        // 집중/휴식 분 단위 설정
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  // ---------- 달력 그리기 ----------
  function renderCalendar() {
    calendarGrid.innerHTML = '';

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekday = firstDay.getDay(); // 이번 달 1일이 무슨 요일
    const totalCells = 35;

    const todayKey = formatDateKey(new Date());

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'calendar-cell';

      // 이번 달 1일 기준으로 며칠째인지 계산 (음수/초과 = 이번 달 x)
      const dayOffset = i - startWeekday;
      const cellDate = new Date(viewYear, viewMonth, 1 + dayOffset);
      const isThisMonth = cellDate.getMonth() === viewMonth;

      if (!isThisMonth) {
        cell.classList.add('empty');
        cell.textContent = '🚩';
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

  // ---------- 오늘의 경기 UI 갱신 (가로 게이지 + 세트 칸) ----------
  // 실제 세트 수는 studyData(localStorage)에서 바로 읽어옵니다.
  // 세트를 채우는 타이머 자체는 정원이의 타이머 화면에서 돌아가고,
  // 거기서 세트가 끝날 때마다 studyData에 저장해주는 방식이에요.
  function updateMatchProgressUI() {
    const todaySets = getTodayRecord(studyData).sets;
    matchProgressLabel.textContent = todaySets + ' / ' + MAX_SETS + ' SETS';

    setSegments.forEach(function (segment, index) {
      if (index < todaySets) {
        segment.classList.add('filled');
      } else {
        segment.classList.remove('filled');
      }
    });
  }

  // ---------- 안내 문구(NEXT) 갱신 ----------
  // 정원이의 타이머 화면이 저장해둔 상태(studyStadiumTimerStatus)를 읽어와서
  // 지금 집중 중인지 / 쉬는 중인지 / 아직 시작 전인지 보여줍니다.
  function updateNextInfoUI() {
    const todaySets = getTodayRecord(studyData).sets;
    const timerStatus = loadTimerStatus(); // { phase: 'focus' | 'break' | null }

    if (todaySets >= MAX_SETS) {
      matchNextTitle.textContent = '오늘 경기 종료 (FULL TIME)';
      matchNextDesc.textContent = '4세트 모두 완료했어요. 내일 또 만나요!';
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

  // ---------- 경기하러 가기 버튼 ----------
  // 이제 이 화면에서 직접 타이머를 돌리지 않고,
  // 정원이가 만들고 있는 타이머 진행 화면으로 이동만 시켜줍니다.
  // TODO: 정원이가 타이머 화면 파일을 올리면, 아래 파일 이름을 실제 파일명으로 바꿔주세요!
  kickoffBtn.addEventListener('click', function () {
    if (kickoffBtn.disabled) return;
    window.location.href = '../html/Timer.html';
  });

  // ---------- 실시간 상태 갱신 ----------
  // 타이머 화면(정원이 화면)에서 값이 바뀌는 걸 1초마다 다시 읽어와서
  // 세트 수 / 안내 문구를 최신 상태로 보여줍니다.
  setInterval(function () {
    studyData = loadData();
    renderCalendar();
    renderStatsPreview();
    updateMatchProgressUI();
    updateNextInfoUI();
  }, 1000);

  // ---------- 공부 일지 ----------
  const todayKeyForNote = formatDateKey(new Date());
  if (studyData[todayKeyForNote]) {
    studyNote.value = studyData[todayKeyForNote].note || '';
  }
  saveNoteBtn.addEventListener('click', function () {
    const todayKey = formatDateKey(new Date());
    studyData[todayKey] = studyData[todayKey] || { sets: 0, note: '' };
    studyData[todayKey].note = studyNote.value;
    saveData(studyData);
  });

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

    // 이상한 값(0 이하, 숫자 아님)이 들어오면 기본값
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
});