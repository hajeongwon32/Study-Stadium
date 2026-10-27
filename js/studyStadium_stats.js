import { supabase } from './lib/supabase-client.js';
import { getStudyRecords } from './services/record-service.js';

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

  const ddayStatus = document.getElementById('ddayStatus');

  const helpBtn = document.getElementById('helpBtn');
  const helpOverlay = document.getElementById('helpOverlay');
  const helpCloseBtn = document.getElementById('helpCloseBtn');
  const helpCloseX = document.getElementById('helpCloseX');



  const settings = loadSettings();

  // ---------- 서버 기록을 통계 계산용 모양으로 바꾸기 ----------
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

  // ---------- 통계 화면 전체 다시 그리기 ----------
  function renderStats(studyData) {
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

    // 디데이: 시작일로부터 며칠째인지 + 그 중 며칠을 공부했는지
    const daysSinceStart = getDaysSinceStart();
    ddayStatus.textContent =
      '스타디움을 시작한 지 ' + daysSinceStart + '일째, 그 중 ' + stats.matchDays + '일 공부했어요.';
  }

  // ---------- 서버(Supabase)에서 공부 기록 받아오기 ----------
  function loadStatsFromServer() {
    supabase.auth.getSession().then(function (result) {
      const session = result.data.session;

      if (!session) {
        renderStats(loadData());
        return;
      }

      getStudyRecords({ userId: session.user.id }).then(function (records) {
        renderStats(toStudyData(records));
      }).catch(function (error) {
        console.error('공부 기록 불러오기 실패:', error);
        renderStats(loadData());
      });
    }).catch(function (error) {
      console.error('로그인 상태 확인 실패:', error);
      renderStats(loadData());
    });
  }

  // 처음 한 번 그리고, 이후로는 5초마다 서버에서 다시 받아와서 최신 상태를 유지
  loadStatsFromServer();
  setInterval(loadStatsFromServer, 5000);

  // ---- 도움말 팝업 ----
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
});
