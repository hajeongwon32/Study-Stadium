import { supabase } from "./lib/supabase-client.js";
import { getStudyRecords } from "./services/record-service.js";

// 잔디 단계(getStageKey 결과)를 화면에 보여줄 이름으로 바꿉니다.
const STAGE_LABELS = {
  soil: "흙 (공부 안 한 날)",
  sprout: "싹",
  leaf: "잎",
  stadium: "구장 (FULL TIME)",
};

document.addEventListener("DOMContentLoaded", () => {
  const reportOverlay = document.getElementById("reportOverlay");
  const reportDate = document.getElementById("reportDate");
  const reportSets = document.getElementById("reportSets");
  const reportTime = document.getElementById("reportTime");
  const reportStage = document.getElementById("reportStage");
  const reportNote = document.getElementById("reportNote");
  const reportCloseBtn = document.getElementById("reportCloseBtn");

  // 'YYYY-MM-DD'를 'YYYY / MM / DD'로 바꿉니다.
  const formatReportDate = (dateKey) => dateKey.split("-").join(" / ");

  // 그날 기록을 가져옵니다. 로그인 안 되어 있으면 메인 화면처럼 로컬 기록을 씁니다.
  const getDayRecord = async (dateKey) => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const localRecord = loadData()[dateKey];
      return localRecord
        ? { sets: localRecord.sets || 0, total_time: localRecord.minutes || 0, note: localRecord.note || "" }
        : null;
    }

    const records = await getStudyRecords({ userId: session.user.id, startDate: dateKey, endDate: dateKey });
    return records[0] || null;
  };

  // 리포트 내용을 채웁니다. record가 null이면 기록 없는 날로 표시합니다.
  const fillReport = (record) => {
    const sets = record?.sets || 0;
    const note = record?.note?.trim();

    reportSets.textContent = `${sets} / ${MAX_SETS} SETS`;
    reportTime.textContent = `${record?.total_time || 0}분`;
    reportStage.textContent = STAGE_LABELS[getStageKey(sets)];
    reportNote.textContent = note || "작성한 노트가 없어요.";
    reportNote.classList.toggle("empty", !note);
  };

  // 날짜 칸을 누르면 그날 경기 리포트를 엽니다.
  const openReport = async (dateKey) => {
    reportDate.textContent = formatReportDate(dateKey);
    reportSets.textContent = "불러오는 중...";
    reportTime.textContent = "";
    reportStage.textContent = "";
    reportNote.textContent = "";
    reportNote.classList.remove("empty");
    reportOverlay.hidden = false;

    try {
      fillReport(await getDayRecord(dateKey));
    } catch (error) {
      console.error("경기 리포트 불러오기 실패:", error);
      reportSets.textContent = "기록을 불러오지 못했어요.";
    }
  };

  const closeReport = () => {
    reportOverlay.hidden = true;
  };

  // 메인 화면 달력이 보내는 날짜 클릭 이벤트 (detail.dateKey = 'YYYY-MM-DD')
  document.addEventListener("dayClicked", (e) => openReport(e.detail.dateKey));

  reportCloseBtn.addEventListener("click", closeReport);
  reportOverlay.addEventListener("click", (e) => {
    if (e.target === reportOverlay) closeReport();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !reportOverlay.hidden) closeReport();
  });
});
