document.addEventListener('DOMContentLoaded', function () {

  const statTotalSets = document.getElementById('statTotalSets');
  const statFocusTime = document.getElementById('statFocusTime');
  const statMatchDays = document.getElementById('statMatchDays');
  const statStreak = document.getElementById('statStreak');
  const statMonthSets = document.getElementById('statMonthSets');
  const statAvgTime = document.getElementById('statAvgTime');

  const growthSoil = document.getElementById('growthSoil');
  const growthSprout = document.getElementById('growthSprout');
  const growthLeaf = document.getElementById('growthLeaf');
  const growthStadium = document.getElementById('growthStadium');
  const growthSoilCount = document.getElementById('growthSoilCount');
  const growthSproutCount = document.getElementById('growthSproutCount');
  const growthLeafCount = document.getElementById('growthLeafCount');
  const growthStadiumCount = document.getElementById('growthStadiumCount');

  const overviewStatus = document.getElementById('overviewStatus');

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

  const studyData = loadData();
  let settings = loadSettings();
  const stats = computeStats(studyData, settings);

  statTotalSets.textContent = stats.totalSets;
  statFocusTime.textContent = stats.totalTimeLabel;
  statMatchDays.textContent = stats.matchDays;
  statStreak.textContent = stats.streak + ' DAYS';
  statMonthSets.textContent = stats.monthSets;
  statAvgTime.textContent = stats.avgTimeLabel;

  const counts = stats.stageCounts;
  const maxCount = Math.max(1, counts.soil, counts.sprout, counts.leaf, counts.stadium);

  growthSoil.style.width = (counts.soil / maxCount) * 100 + '%';
  growthSprout.style.width = (counts.sprout / maxCount) * 100 + '%';
  growthLeaf.style.width = (counts.leaf / maxCount) * 100 + '%';
  growthStadium.style.width = (counts.stadium / maxCount) * 100 + '%';

  growthSoilCount.textContent = counts.soil;
  growthSproutCount.textContent = counts.sprout;
  growthLeafCount.textContent = counts.leaf;
  growthStadiumCount.textContent = counts.stadium;

  overviewStatus.textContent = stats.matchDays > 0
    ? '지금까지 ' + stats.matchDays + '일 동안 기록을 남겼어요.'
    : '아직 기록된 공부 데이터가 없습니다.';

  // ---- 도움말 팝업 ----
  function openHelp() { helpOverlay.hidden = false; }
  function closeHelp() { helpOverlay.hidden = true; }

  helpBtn.addEventListener('click', openHelp);
  helpCloseBtn.addEventListener('click', closeHelp);
  helpCloseX.addEventListener('click', closeHelp);
  helpOverlay.addEventListener('click', function (e) {
    if (e.target === helpOverlay) closeHelp();
  });

  // ---- 집중/휴식 시간 설정 팝업 ----
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
});
