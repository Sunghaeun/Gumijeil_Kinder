/* 캘린더, 생일(음력 변환 포함), 캘린더 메모, 캘린더 인쇄 */
/* ===== [수정5+7] 생일 데이터 수집 (학생 + 교사, 음력 변환 포함) ===== */

function lunarToSolarInYear(year, lunarMonth, lunarDay) {
  // lunar-javascript 라이브러리가 로드되어 있으면 정확히 변환, 없으면 원본 날짜를 근사치로 사용
  try {
    if (typeof Lunar !== "undefined") {
      const lunar = Lunar.fromYmd(year, lunarMonth, lunarDay);
      const solar = lunar.getSolar();
      return { mo: solar.getMonth(), dd: solar.getDay() };
    }
  } catch (e) {}
  return { mo: lunarMonth, dd: lunarDay }; // fallback (근사치)
}

function collectBirthdays(year) {
  const bdays = {}; // { "MM-DD": [{className, name}] }
  const add = (mo, dd, className, name) => {
    const key = `${String(mo).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    if (!bdays[key]) bdays[key] = [];
    bdays[key].push({ className, name });
  };

  state.classes.forEach(cls => {
    if (cls.kind === "alt") return;
    cls.members.forEach(m => {
      if (!m.dob) return;
      const parts = m.dob.split(".");
      if (parts.length < 3) return;
      add(parseInt(parts[1], 10), parseInt(parts[2], 10), cls.name, m.name);
    });
  });

  (state.teachers || []).forEach(t => {
    if (!t.dob) return;
    const parts = t.dob.split(".");
    if (parts.length < 3) return;
    const mo = parseInt(parts[1], 10), dd = parseInt(parts[2], 10);
    if (t.calType === "lunar") {
      const solar = lunarToSolarInYear(year, mo, dd);
      add(solar.mo, solar.dd, "교사(음)", t.name);
    } else {
      add(mo, dd, "교사", t.name);
    }
  });

  return bdays;
}

/* ===== [수정4+5] 캘린더 (출석 수 표시 + 생일 표시) ===== */

function calMonthLabel(ym) { const [y, mo] = ym.split("-").map(Number); return `${y}년 ${mo}월`; }
function calShiftMonth(ym, delta) {
  let [y, mo] = ym.split("-").map(Number); mo += delta;
  if (mo < 1) { mo = 12; y--; } if (mo > 12) { mo = 1; y++; }
  return `${y}-${String(mo).padStart(2, "0")}`;
}
function calPrevMonth() { attState.calMonth = calShiftMonth(attState.calMonth, -1); saveAttendance(); renderAttendance(); }
function calNextMonth() { attState.calMonth = calShiftMonth(attState.calMonth, 1); saveAttendance(); renderAttendance(); }

function calToggleDate(dateStr) {
  const existing = attState.weeks.find(w => w.label === dateStr);
  if (existing) { if (confirm(`${dateStr} 주차를 삭제할까요?`)) removeWeek(existing.id); return; }
  if (!confirm(`${dateStr}을(를) 출석 주차로 추가할까요?`)) return;
  ensureWeekForDate(dateStr); saveAttendance(); renderAttendance(); toast(`${dateStr} 주차를 추가했습니다.`);
}

function calendarHtml() {
  const ym = attState.calMonth;
  const [y, mo] = ym.split("-").map(Number);
  const startWeekday = new Date(y, mo - 1, 1).getDay();
  const daysInMonth = new Date(y, mo, 0).getDate();
  const weekLabelSet = new Map();
  attState.weeks.forEach(w => weekLabelSet.set(w.label, w.id));
  const todayIso = todayStr();
  const bdays = collectBirthdays(y);

  let cells = "";
  for (let i = 0; i < startWeekday; i++) cells += `<div class="cal-cell cal-empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isSun = (startWeekday + d - 1) % 7 === 0;
    const weekId = weekLabelSet.get(dateStr);
    const has = !!weekId;
    const isToday = dateStr === todayIso;
    const cls = ["cal-cell"];
    if (isSun) cls.push("cal-sun");
    if (has) cls.push("cal-active");
    if (isToday) cls.push("cal-today");

    // [수정4] 출석 수 요약
    let countsHtml = "";
    if (has) {
      const sC = weekStudentCount(weekId), tC = weekTeacherCount(weekId);
      countsHtml = `<div class="cal-counts">학생${sC} 교사${tC}</div>`;
    }

    // [수정5] 생일 표시
    const mmdd = `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const bdayList = bdays[mmdd] || [];
    let bdayHtml = "";
    if (bdayList.length) {
      bdayHtml = bdayList.map(b => `<div class="cal-bday">🎂${b.className}-${b.name}</div>`).join("");
    }

    // 날짜별 메모 표시 (클릭 시 해당 날짜 메모로 바로 이동, 출석 주차 토글과 분리)
    const noteHtml = (attState.dateNotes && attState.dateNotes[dateStr])
      ? `<div class="cal-note-mark" onclick="event.stopPropagation(); calNoteJumpToDate('${dateStr}')" title="이 날짜 메모 보기">📝</div>` : "";

    cells += `<div class="${cls.join(" ")}" onclick="calToggleDate('${dateStr}')">${d}${countsHtml}${bdayHtml}${noteHtml}</div>`;
  }

  return `<div class="att-class-block cal-block"><h3>🗓 주별 캘린더
    <span class="cal-nav"><button class="btn-mini btn-ghost" onclick="calPrevMonth()">‹ 이전달</button>
    <span class="cal-month-label">${calMonthLabel(ym)}</span>
    <button class="btn-mini btn-ghost" onclick="calNextMonth()">다음달 ›</button></span></h3>
    <div class="cal-grid">
      <div class="cal-dow">일</div><div class="cal-dow">월</div><div class="cal-dow">화</div>
      <div class="cal-dow">수</div><div class="cal-dow">목</div><div class="cal-dow">금</div><div class="cal-dow">토</div>
      ${cells}
    </div>
    <div class="cal-hint">날짜 클릭 → 출석 주차 추가/삭제 · 초록 셀 = 등록된 주차 · 🎂 = 생일자 · 📝 = 날짜별 메모</div>
    ${calNoteHtml()}
  </div>`;
}

/* ===== [수정8] 캘린더 메모 (자유 메모 / 날짜별 메모 + 서식 + 이미지 + 저장버튼) ===== */

let calNoteTarget = "free"; // "free" 또는 "YYYY-MM-DD"
let editingFreeNoteId = null; // 자유메모 보관함에서 수정 중인 항목 id (null = 새 메모 작성 중)
let freeNotesExpanded = false; // 자유메모 보관함 펼침 여부

function calNoteDateOptions(selected) {
  const ym = attState.calMonth;
  const [y, mo] = ym.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  const dowNames = ["일", "월", "화", "수", "목", "금", "토"];
  let opts = "";
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const dow = dowNames[new Date(y, mo - 1, d).getDay()];
    const hasNote = attState.dateNotes && attState.dateNotes[dateStr];
    const sel = dateStr === selected ? "selected" : "";
    opts += `<option value="${dateStr}" ${sel}>${y}.${String(mo).padStart(2, "0")}.${String(d).padStart(2, "0")} (${dow})${hasNote ? " 📝" : ""}</option>`;
  }
  return opts;
}

function fmtNoteTime(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function calNoteHtml() {
  const target = calNoteTarget;
  let composeContent;
  if (target === "free") {
    composeContent = editingFreeNoteId ? (getFreeNoteContent(editingFreeNoteId) || "") : "";
  } else {
    composeContent = (attState.dateNotes && attState.dateNotes[target]) || "";
  }

  const editingBadge = (target === "free" && editingFreeNoteId)
    ? `<span class="cal-note-editing-badge">✏️ 보관함 메모 수정 중 <button class="cal-note-cancel-edit" onclick="cancelEditFreeNote()">취소</button></span>`
    : "";

  const hasExistingDateNote = target !== "free" && !!(attState.dateNotes && attState.dateNotes[target] && attState.dateNotes[target] !== "<br>");

  const saveLabel = target === "free"
    ? (editingFreeNoteId ? "💾 수정 저장" : "💾 새 메모 저장")
    : (hasExistingDateNote ? "💾 수정 저장" : "💾 메모 저장");

  const dateDeleteBtn = hasExistingDateNote
    ? `<button class="btn-mini btn-ghost cal-note-delete-btn" onclick="deleteDateNote('${target}')" title="이 날짜 메모 삭제">🗑 삭제</button>`
    : "";

  const notes = attState.freeNotes || [];
  const archiveSection = target === "free" ? `
    <button class="cal-note-archive-toggle" onclick="toggleFreeArchive()">
      <span class="cal-note-archive-arrow">${freeNotesExpanded ? "▲" : "▼"}</span> 자유메모 보관함 (${notes.length})
    </button>
    ${freeNotesExpanded ? freeNotesArchiveHtml() : ""}
  ` : "";

  return `<div class="cal-note-inner">
    <div class="cal-note-target-row">
      <label for="calNoteTarget">📝 메모</label>
      <select id="calNoteTarget" onchange="calNoteSwitchTarget(this.value)">
        <option value="free" ${target === "free" ? "selected" : ""}>자유 메모</option>
        <optgroup label="날짜별 메모 (${calMonthLabel(attState.calMonth)})">
          ${calNoteDateOptions(target)}
        </optgroup>
      </select>
      ${editingBadge}
    </div>
    <div class="cal-note-toolbar">
      <button onmousedown="event.preventDefault()" onclick="calNoteExec('bold')" title="굵게"><b>B</b></button>
      <button onmousedown="event.preventDefault()" onclick="calNoteExec('italic')" title="기울임"><i>I</i></button>
      <button onmousedown="event.preventDefault()" onclick="calNoteExec('insertUnorderedList')" title="목록">≡</button>
      <button onmousedown="event.preventDefault()" onclick="calNoteImageBtn()" title="이미지 삽입">🖼</button>
      <input type="file" id="calNoteImgInput" accept="image/*" style="display:none">
      <div class="cal-note-toolbar-right">
        ${dateDeleteBtn}
        <button class="btn-primary btn-mini cal-note-save-btn" onclick="calNoteSaveClick()">${saveLabel}</button>
      </div>
    </div>
    <div class="cal-note-editor" id="calNoteEditor" contenteditable="true">${composeContent}</div>
    ${archiveSection}
  </div>`;
}

function deleteDateNote(dateStr) {
  if (!confirm(`${dateStr} 메모를 삭제할까요?`)) return;
  if (attState.dateNotes) delete attState.dateNotes[dateStr];
  saveAttendance();
  renderAttendance();
  toast("메모를 삭제했습니다.");
}

function freeNotesArchiveHtml() {
  const notes = attState.freeNotes || [];
  if (!notes.length) return `<div class="cal-note-archive-empty">보관함이 비어 있습니다. 메모를 작성하고 저장하면 여기에 쌓입니다.</div>`;
  return `<div class="cal-note-archive">
    ${notes.map(n => `
      <div class="cal-note-archive-item ${editingFreeNoteId === n.id ? "cal-note-archive-item-editing" : ""}">
        <div class="cal-note-archive-meta">
          <span class="cal-note-archive-time">${fmtNoteTime(n.updatedAt || n.createdAt)}${n.updatedAt && n.updatedAt !== n.createdAt ? " (수정됨)" : ""}</span>
          <span class="cal-note-archive-actions">
            <button class="btn-mini btn-ghost" onclick="editFreeNote('${n.id}')">수정</button>
            <button class="btn-mini btn-ghost" onclick="deleteFreeNote('${n.id}')">삭제</button>
          </span>
        </div>
        <div class="cal-note-archive-content">${n.content}</div>
      </div>
    `).join("")}
  </div>`;
}

function getFreeNoteContent(id) {
  const n = (attState.freeNotes || []).find(x => x.id === id);
  return n ? n.content : "";
}

function editFreeNote(id) {
  calNoteTarget = "free";
  editingFreeNoteId = id;
  freeNotesExpanded = true;
  renderAttendance();
  setTimeout(() => {
    const editor = document.getElementById("calNoteEditor");
    if (editor) editor.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function cancelEditFreeNote() {
  editingFreeNoteId = null;
  renderAttendance();
}

function deleteFreeNote(id) {
  if (!confirm("이 메모를 삭제할까요?")) return;
  attState.freeNotes = (attState.freeNotes || []).filter(x => x.id !== id);
  if (editingFreeNoteId === id) editingFreeNoteId = null;
  saveAttendance();
  renderAttendance();
  toast("메모를 삭제했습니다.");
}

function toggleFreeArchive() {
  freeNotesExpanded = !freeNotesExpanded;
  renderAttendance();
}

function calNoteSwitchTarget(value) {
  calNoteTarget = value;
  editingFreeNoteId = null;
  renderAttendance();
}

// 캘린더 셀의 📝 아이콘 클릭 시: 해당 날짜 메모로 전환하고 메모 영역으로 스크롤 + 하이라이트
function calNoteJumpToDate(dateStr) {
  calNoteTarget = dateStr;
  editingFreeNoteId = null;
  renderAttendance();
  setTimeout(() => {
    const editor = document.getElementById("calNoteEditor");
    if (editor) {
      editor.scrollIntoView({ behavior: "smooth", block: "center" });
      editor.classList.add("cal-note-highlight");
      setTimeout(() => editor.classList.remove("cal-note-highlight"), 1200);
    }
  }, 50);
}

function calNoteExec(cmd) {
  document.getElementById("calNoteEditor").focus();
  document.execCommand(cmd, false, null);
}

function calNoteImageBtn() { document.getElementById("calNoteImgInput").click(); }

function calNoteInsertImage(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    document.getElementById("calNoteEditor").focus();
    document.execCommand("insertImage", false, ev.target.result);
  };
  reader.readAsDataURL(file);
  e.target.value = "";
}

function calNoteSaveClick() {
  const html = document.getElementById("calNoteEditor").innerHTML;
  if (calNoteTarget === "free") {
    const now = new Date().toISOString();
    if (editingFreeNoteId) {
      const n = (attState.freeNotes || []).find(x => x.id === editingFreeNoteId);
      if (n) { n.content = html; n.updatedAt = now; }
      editingFreeNoteId = null;
      toast("메모를 수정했습니다.");
    } else {
      if (!html || html === "<br>") { toast("빈 메모는 저장되지 않습니다."); return; }
      if (!attState.freeNotes) attState.freeNotes = [];
      attState.freeNotes.unshift({ id: "note" + Date.now(), content: html, createdAt: now, updatedAt: now });
      freeNotesExpanded = true;
      toast("메모를 보관함에 저장했습니다.");
    }
  } else {
    if (!attState.dateNotes) attState.dateNotes = {};
    attState.dateNotes[calNoteTarget] = html;
    toast("메모를 저장했습니다.");
  }
  saveAttendance();
  renderAttendance();
}

function bindCalNoteEvents() {
  const input = document.getElementById("calNoteImgInput");
  if (input) input.addEventListener("change", calNoteInsertImage);
}

/* ===== [수정4] 캘린더 인쇄 (월 선택 + 표시 내용 선택 + 세로 A4) ===== */

function openCalPrintOpt() {
  document.getElementById("calPrintMonth").value = attState.calMonth;
  document.getElementById("calPrintOptBackdrop").classList.add("open");
}
function closeCalPrintOpt() { document.getElementById("calPrintOptBackdrop").classList.remove("open"); }

function buildPrintAreaCal(ym, showBday, showAtt) {
  const container = document.getElementById("printAreaCal");
  const [y, mo] = ym.split("-").map(Number);
  const startWeekday = new Date(y, mo - 1, 1).getDay();
  const daysInMonth = new Date(y, mo, 0).getDate();
  const weekLabelSet = new Map();
  attState.weeks.forEach(w => weekLabelSet.set(w.label, w.id));
  const bdays = collectBirthdays(y);

  const dows = ["일", "월", "화", "수", "목", "금", "토"];
  let cells = dows.map(d => `<div class="cp-dow">${d}</div>`).join("");

  const totalCells = startWeekday + daysInMonth;
  const totalRows = Math.ceil(totalCells / 7);

  for (let i = 0; i < startWeekday; i++) cells += `<div class="cp-cell cp-empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const isSun = (startWeekday + d - 1) % 7 === 0;
    const weekId = weekLabelSet.get(dateStr);

    let inner = "";
    if (showBday) {
      const mmdd = `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const list = bdays[mmdd] || [];
      inner += list.map(b => `<div class="cp-bday">🎂${escapeHtml(b.className)}-${escapeHtml(b.name)}</div>`).join("");
    }
    if (showAtt && weekId) {
      const sC = weekStudentCount(weekId), tC = weekTeacherCount(weekId);
      inner += `<div class="cp-att">학생 ${sC}명 · 교사 ${tC}명</div>`;
    }
    cells += `<div class="cp-cell ${isSun ? "cp-sun" : ""}"><div class="cp-daynum">${d}</div>${inner}</div>`;
  }
  const usedCells = startWeekday + daysInMonth;
  const remain = totalRows * 7 - usedCells;
  for (let i = 0; i < remain; i++) cells += `<div class="cp-cell cp-empty"></div>`;

  container.innerHTML = `<div class="print-page cal-print-page">
    <div class="print-header"><div class="p-title">${escapeHtml(state.title)} · ${y}년 ${mo}월 캘린더</div>
    <div class="p-date">${state.updated ? "기준일: " + escapeHtml(state.updated) : ""}</div></div>
    <div class="cal-print-grid" style="grid-template-rows:auto repeat(${totalRows},1fr);">${cells}</div>
  </div>`;
}

function doPrintCalendar() {
  const ym = document.getElementById("calPrintMonth").value || attState.calMonth;
  const showBday = document.getElementById("calPrintBday").checked;
  const showAtt = document.getElementById("calPrintAtt").checked;
  buildPrintAreaCal(ym, showBday, showAtt);
  closeCalPrintOpt();
  document.body.classList.add("print-cal");
  setTimeout(() => window.print(), 100);
}
