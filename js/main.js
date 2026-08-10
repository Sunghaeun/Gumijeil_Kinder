/* 앱 시작점: 로그인 확인 → 서버에서 데이터 불러오기 → 화면 렌더링 → 이벤트 연결
   (원본 파일의 마지막 "이벤트 바인딩"/"시작" 부분을 비동기 초기화로 재구성했습니다) */

function bindEvents() {
  document.getElementById("btnAddPerson").addEventListener("click", () => openAddModal(null));
  document.getElementById("btnPrint").addEventListener("click", openPrintOpt);
  document.getElementById("btnAddClass").addEventListener("click", () => openClassModal());
  document.getElementById("btnCancelClassModal").addEventListener("click", closeClassModal);
  document.getElementById("btnSaveClassModal").addEventListener("click", saveClassModal);
  document.getElementById("classModalBackdrop").addEventListener("click", (e) => { if (e.target.id === "classModalBackdrop") closeClassModal(); });
  document.getElementById("btnCancelModal").addEventListener("click", closeModal);
  document.getElementById("btnSaveModal").addEventListener("click", saveModal);
  document.getElementById("modalBackdrop").addEventListener("click", (e) => { if (e.target.id === "modalBackdrop") closeModal(); });
  document.getElementById("printOptBackdrop").addEventListener("click", (e) => { if (e.target.id === "printOptBackdrop") closePrintOpt(); });
  document.getElementById("searchBox").addEventListener("input", applySearch);
  document.getElementById("tabRoster").addEventListener("click", () => switchTab("roster"));
  document.getElementById("tabTeachers").addEventListener("click", () => switchTab("teachers"));
  document.getElementById("tabAttendance").addEventListener("click", () => switchTab("attendance"));
  document.getElementById("btnAddWeek").addEventListener("click", addWeek);
  document.getElementById("btnPrintAtt").addEventListener("click", openAttPrintOpt);
  document.getElementById("attPrintOptBackdrop").addEventListener("click", (e) => { if (e.target.id === "attPrintOptBackdrop") closeAttPrintOpt(); });
  document.getElementById("btnPrintCal").addEventListener("click", openCalPrintOpt);
  document.getElementById("calPrintOptBackdrop").addEventListener("click", (e) => { if (e.target.id === "calPrintOptBackdrop") closeCalPrintOpt(); });
  document.getElementById("btnCancelTeacherModal").addEventListener("click", closeTeacherModal);
  document.getElementById("btnSaveTeacherModal").addEventListener("click", saveTeacherModal);
  document.getElementById("teacherModalBackdrop").addEventListener("click", (e) => { if (e.target.id === "teacherModalBackdrop") closeTeacherModal(); });
  document.getElementById("btnPrintTeachers").addEventListener("click", openTeacherPrintOpt);
  document.getElementById("teacherPrintOptBackdrop").addEventListener("click", (e) => { if (e.target.id === "teacherPrintOptBackdrop") closeTeacherPrintOpt(); });
  window.addEventListener("afterprint", () => { document.body.classList.remove("print-att", "print-cal", "print-teachers"); });

  document.getElementById("yearSelect").addEventListener("change", (e) => switchYear(e.target.value));
  document.getElementById("btnUploadRoster").addEventListener("click", () => document.getElementById("rosterUploadInput").click());
  document.getElementById("rosterUploadInput").addEventListener("change", handleRosterFileSelected);
  document.getElementById("rosterUploadPreviewBackdrop").addEventListener("click", (e) => { if (e.target.id === "rosterUploadPreviewBackdrop") closeRosterUploadPreview(); });
  document.getElementById("rosterUploadYearInput").addEventListener("change", refreshRosterUploadDiff);

  const logoutBtn = document.getElementById("btnLogout");
  if (logoutBtn) logoutBtn.addEventListener("click", logout);
}

async function init() {
  if (!requireLogin()) return; // 로그인 안 되어 있으면 login.html로 이동하고 중단

  const loadingEl = document.getElementById("loadingNote");
  const wrapEl = document.querySelector(".wrap");

  try {
    metaState = await loadMeta();
    viewYear = metaState.currentYear;
    state = await loadState(viewYear);
    attState = await loadAttendance();
  } catch (e) {
    console.error(e);
    if (loadingEl) loadingEl.textContent = "데이터를 불러오지 못했습니다. 새로고침 해주세요.";
    return;
  }

  if (loadingEl) loadingEl.style.display = "none";
  if (wrapEl) wrapEl.style.display = "";

  render();
  bindEvents();
}

init();
