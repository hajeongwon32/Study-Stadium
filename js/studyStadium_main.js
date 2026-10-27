import { supabase } from './lib/supabase-client.js';
import { getStudyRecords } from './services/record-service.js';

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


  // ---------- 데이터 불러오기 ----------
  let studyData = {};
  const settings = loadSettings();
  let viewYear = new Date().getFullYear();
  let viewMonth = new Date().getMonth();

  // 오늘 경기를 서버(Supabase)에서 "이미 끝냄"으로 표시했는지 여부.
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
        // 이번 달이 아닌 칸(지난달/다음달)은 코너플래그로 표시
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

        // 클릭해서 그날 정보를 볼 수 있는 칸인지 정하기 (정원이의 Match Report 팝업이 이 신호를 받아요)
        // - 오늘보다 미래인 날: 클릭 불가
        // - 오늘인데 아직 오늘 경기를 안 끝냈으면: 클릭 불가
        // - 그 외(오늘을 끝낸 오늘 칸, 또는 오늘 이전 칸): 클릭 가능
        const isFutureDay = dateKey > todayKey;
        const isTodayCell = dateKey === todayKey;
        const canOpenDay = !isFutureDay && (!isTodayCell || todayFinishedOnServer);
        if (canOpenDay) {
          cell.classList.add('clickable');
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
  //통계화면과 연동이 안 됨 실시간 화 할 것
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

  // ---------- 화면 전체 다시 그리기 ----------
  function renderAll() {
    renderCalendar();
    renderStatsPreview();
    updateMatchProgressUI();
    updateNextInfoUI();
  }

  // ---------- 서버 기록을 달력·통계용 모양으로 바꾸기 ----------
  // [{ date, sets, total_time, note, is_finished }] → { 'YYYY-MM-DD': { sets, minutes, note } }
  function toStudyData(records) {
    const data = {};
    records.forEach(function (record) {
      data[record.date] = {
        sets: record.sets,
        minutes: record.total_time,
        note: record.note || '',
      };
    });
    return data;
  }

  // ---------- 서버(Supabase)에서 공부 기록 + 오늘 완료 여부 받아오기 ----------
  function loadStudyDataFromServer() {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;

      if (!session) {
        studyData = loadData();
        todayFinishedOnServer = false;
        renderAll();
        return;
      }

      getStudyRecords({ userId: session.user.id }).then(function (records) {
        const todayKey = formatDateKey(new Date());
        const todayRecord = records.find(function (record) { return record.date === todayKey; });

        studyData = toStudyData(records);
        todayFinishedOnServer = Boolean(todayRecord && todayRecord.is_finished);
        renderAll();
      }).catch(function (error) {
        console.error('공부 기록 불러오기 실패:', error);
      });
    }).catch(function (error) {
      console.error('로그인 상태 확인 실패:', error);
    });
  }

  calendarGrid.addEventListener('click', function (e) {
    const cell = e.target.closest('.calendar-cell');
    if (!cell || !cell.classList.contains('clickable')) return;

    const dateKey = cell.dataset.date;
    document.dispatchEvent(new CustomEvent('dayClicked', { detail: { dateKey: dateKey } }));
  });

  // ---------- 경기하러 가기 버튼 ----------
  kickoffBtn.addEventListener('click', function () {
    if (kickoffBtn.disabled) return;
    window.location.href = 'timer.html';
  });

  // ---------- 타이머 진행 상태 갱신 (로컬 데이터, 1초마다) ----------
  setInterval(updateNextInfoUI, 1000);

  // ---------- 공부 기록 갱신 (서버에 물어보는 거라 5초마다) ----------
  setInterval(loadStudyDataFromServer, 5000);

  // 타이머 화면에서 '뒤로 가기'로 돌아왔을 때도 바로 새 기록을 받아옵니다.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) loadStudyDataFromServer();
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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !helpOverlay.hidden) closeHelp();
  });

  renderAll();
  loadStudyDataFromServer();
});