const STORAGE_KEY = 'studyStadiumData';       // 공부 기록 저장할 때 쓰는 이름표
const SETTINGS_KEY = 'studyStadiumSettings';  // 집중/휴식 시간 설정 저장할 때 쓰는 이름표

//50분 집중 / 10분 휴식으로 변경, 조절도 가능하게.
const DEFAULT_FOCUS_MINUTES = 50;
const DEFAULT_BREAK_MINUTES = 10;
const MAX_SETS = 4; // 하루에 채울 수 있는 최대 세트 수

function getStageKey(sets) {
  if (sets <= 0) return 'soil';      // 0세트 = 흙
  if (sets === 1) return 'sprout';   // 1세트 = 싹
  if (sets <= 3) return 'leaf';      // 2~3세트 = 잎
  return 'stadium';                  // 4세트 = 구장(완성)
}

// ------------------- 집중/휴식 시간 설정 -------------------
function loadSettings() {
  const saved = localStorage.getItem(SETTINGS_KEY);

  if (!saved) {
    return { focusMinutes: DEFAULT_FOCUS_MINUTES, breakMinutes: DEFAULT_BREAK_MINUTES };
  }

  const parsed = JSON.parse(saved);
  return {
    focusMinutes: parsed.focusMinutes || DEFAULT_FOCUS_MINUTES,
    breakMinutes: parsed.breakMinutes || DEFAULT_BREAK_MINUTES,
  };
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function getFocusSeconds(settings) {
  return settings.focusMinutes * 60;
}
function getBreakSeconds(settings) {
  return settings.breakMinutes * 60;
}

// ------------------- 타이머 진행 상태 (정원이의 타이머 화면과 공유) -------------------
// 실제 타이머는 정원이가 만드는 타이머 화면에서 돌아가고,
// 메인 화면은 여기 저장된 값만 읽어서 "지금 집중 중인지/쉬는 중인지" 보여줍니다.
const TIMER_STATUS_KEY = 'studyStadiumTimerStatus';

// phase: 'focus'(집중 중) | 'break'(휴식 중) | null(대기 중, 아직 시작 안 함)
function loadTimerStatus() {
  const saved = localStorage.getItem(TIMER_STATUS_KEY);
  if (!saved) return { phase: null };
  return JSON.parse(saved);
}

// 타이머 화면 쪽에서 상태가 바뀔 때마다 이 함수로 저장해주면 됨
function saveTimerStatus(status) {
  localStorage.setItem(TIMER_STATUS_KEY, JSON.stringify(status));
}

// ------------------- 공부 기록 데이터 -------------------

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return {};
  return JSON.parse(saved);
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function formatDateKey(d) {
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return pad2(minutes) + ':' + pad2(seconds);
}

// 오늘 기록 꺼내오기 (없으면 0세트로 취급)
function getTodayRecord(data) {
  const key = formatDateKey(new Date());
  if (data[key]) return data[key];
  return { sets: 0, note: '', minutes: 0 };
}

// 세트 하나 완료 기록 추가하기
function addCompletedSet(data, focusMinutesUsed) {
  const todayKey = formatDateKey(new Date());
  const record = data[todayKey] || { sets: 0, note: '', minutes: 0 };
  record.sets = (record.sets || 0) + 1;
  record.minutes = (record.minutes || 0) + focusMinutesUsed;
  data[todayKey] = record;
  return data;
}

// ------------------- 시작일 기록 (디데이 계산용) -------------------
const START_DATE_KEY = 'studyStadiumStartDate';

// 이 앱을 시작한 날짜를 구합니다.
// 한 번도 저장된 적 없으면: 이미 기록된 공부 데이터가 있는지 보고,
// 있으면 그 중 가장 빠른 날짜를, 없으면 오늘 날짜를 시작일로 저장합니다.
function getStartDate() {
  const saved = localStorage.getItem(START_DATE_KEY);
  if (saved) return saved;

  const data = loadData();
  let earliest = null;
  for (const dateKey in data) {
    if (!earliest || dateKey < earliest) earliest = dateKey;
  }

  const startDate = earliest || formatDateKey(new Date());
  localStorage.setItem(START_DATE_KEY, startDate);
  return startDate;
}

// 시작일로부터 오늘까지 며칠째인지 (시작한 날 = 1일째로 셉니다)
function getDaysSinceStart() {
  const startDate = new Date(getStartDate() + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today - startDate) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
}

// ------------------- 통계 계산 -------------------
function computeStats(data, settings) {
  const today = new Date();

  let totalSets = 0;
  let totalMinutes = 0;
  let matchDays = 0;
  let monthSets = 0;
  const stageCounts = { soil: 0, sprout: 0, leaf: 0, stadium: 0 };

  for (const dateKey in data) {
    const record = data[dateKey];
    const sets = record.sets || 0;
    if (sets <= 0) continue;

    const minutesStudied = typeof record.minutes === 'number'
      ? record.minutes
      : sets * DEFAULT_FOCUS_MINUTES;

    totalSets += sets;
    totalMinutes += minutesStudied;
    matchDays += 1;
    stageCounts[getStageKey(sets)] += 1;

    const recordDate = new Date(dateKey + 'T00:00:00');
    if (recordDate.getFullYear() === today.getFullYear() &&
        recordDate.getMonth() === today.getMonth()) {
      monthSets += sets;
    }
  }

  let streak = 0;
  const cursor = new Date(today);
  cursor.setHours(0, 0, 0, 0);
  if (getTodayRecord(data).sets === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (true) {
    const key = formatDateKey(cursor);
    if (data[key] && data[key].sets > 0) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  const avgMinutes = matchDays > 0 ? Math.round(totalMinutes / matchDays) : 0;

  return {
    totalSets: totalSets,
    totalTimeLabel: pad2(Math.floor(totalMinutes / 60)) + 'H ' + pad2(totalMinutes % 60) + 'M',
    matchDays: matchDays,
    streak: streak,
    monthSets: monthSets,
    avgTimeLabel: pad2(Math.floor(avgMinutes / 60)) + 'H ' + pad2(avgMinutes % 60) + 'M',
    stageCounts: stageCounts,
  };
}