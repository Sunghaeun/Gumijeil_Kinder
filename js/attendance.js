/* 출석부: 주차 관리, 체크, 합계 계산, 렌더링, 인쇄 */
/* ============================================================
   출석부 (학생/교사 출석 + 캘린더 + 생일 + 일괄 출석)
   ============================================================ */

/* attState는 main.js의 초기화(init) 단계에서 서버로부터 비동기로 불러온 뒤 채워집니다. */
let attState = null;

function defaultAttendanceState() {
  return { weeks: [], records: {}, teacherRecords: {}, calMonth: new Date().toISOString().slice(0, 7), dateNotes: {}, freeNotes: [], autoInitedMonths: [] };
}

/* [변경] localStorage 대신 서버(API)에서 불러옵니다. */
async function loadAttendance() {
  try {
    const p = await apiGet("attendance");
    if (p && Array.isArray(p.weeks) && p.records) {
      if (!p.teacherRecords) p.teacherRecords = {};
      if (!p.calMonth) p.calMonth = new Date().toISOString().slice(0, 7);
      if (!p.dateNotes) p.dateNotes = {};
      if (!p.autoInitedMonths) p.autoInitedMonths = [];
      if (!p.freeNotes) {
        p.freeNotes = [];
        if (p.calNote) {
          const now = new Date().toISOString();
          p.freeNotes.push({ id: "note0", content: p.calNote, createdAt: now, updatedAt: now });
        }
      }
      return p;
    }
  } catch (e) {
    console.error("출석부 불러오기 실패, 빈 데이터로 시작합니다.", e);
  }
  return defaultAttendanceState();
}

/* [변경] localStorage 대신 서버(API)로 저장합니다. */
function saveAttendance() {
  if (!attState) return;
  apiPut("attendance", attState).catch(() => toast("⚠ 저장 실패 - 인터넷 연결을 확인하세요."));
}
function todayStr() { return new Date().toISOString().slice(0, 10); }

function suggestNextWeekLabel() {
  if (!attState.weeks.length) return todayStr();
  const last = attState.weeks[attState.weeks.length - 1].label;
  const d = new Date(last);
  if (!isNaN(d.getTime())) { d.setDate(d.getDate() + 7); return d.toISOString().slice(0, 10); }
  return "";
}

function ensureWeekForDate(dateStr) {
  let wk = attState.weeks.find(w => w.label === dateStr);
  if (wk) return wk.id;
  const id = "w" + Date.now() + Math.floor(Math.random() * 1000);
  attState.weeks.push({ id, label: dateStr });
  attState.weeks.sort((a, b) => a.label < b.label ? -1 : a.label > b.label ? 1 : 0);
  return id;
}

/* [신규] "YYYY-MM" 월에 속하는 출석 주차만 골라냅니다. 아래 출석 체크 표는 이 함수로
   걸러진 주차만 보여줍니다 (현재 캘린더가 보여주는 달과 항상 일치하도록). */
function weeksInMonth(ym) {
  return attState.weeks.filter(w => typeof w.label === "string" && w.label.slice(0, 7) === ym);
}

/* [신규] 캘린더에 표시된 달의 일요일들을 출석 주차로 자동 등록합니다.
   한 번 초기화된 달은 다시 자동으로 채우지 않으므로, 특정 일요일(명절 등 예배 없는 주)을
   사용자가 삭제하면 그 상태가 그대로 유지됩니다. 실제로 새 주차를 추가했으면 true를 반환합니다. */
function ensureMonthSundaysInited(ym) {
  if (!attState.autoInitedMonths) attState.autoInitedMonths = [];
  if (attState.autoInitedMonths.includes(ym)) return false;
  const [y, mo] = ym.split("-").map(Number);
  const daysInMonth = new Date(y, mo, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(y, mo - 1, d).getDay() === 0) {
      const dateStr = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      ensureWeekForDate(dateStr);
    }
  }
  attState.autoInitedMonths.push(ym);
  return true;
}

function addWeek() {
  const suggested = suggestNextWeekLabel();
  const label = prompt("추가할 주의 날짜를 입력하세요 (예: 2026-01-04)", suggested);
  if (label === null) return;
  const id = "w" + Date.now();
  attState.weeks.push({ id, label: label.trim() || suggested || ("주 " + (attState.weeks.length + 1)) });
  saveAttendance(); renderAttendance(); toast("새로운 주가 추가되었습니다.");
}

function removeWeek(weekId) {
  const wk = attState.weeks.find(w => w.id === weekId); if (!wk) return;
  if (!confirm(`'${wk.label}' 주차를 삭제할까요?`)) return;
  attState.weeks = attState.weeks.filter(w => w.id !== weekId);
  Object.values(attState.records).forEach(rec => { delete rec[weekId]; });
  Object.values(attState.teacherRecords).forEach(rec => { delete rec[weekId]; });
  saveAttendance(); renderAttendance();
}

function toggleAttendance(memberId, weekId, checked) {
  if (!attState.records[memberId]) attState.records[memberId] = {};
  attState.records[memberId][weekId] = checked;
  saveAttendance(); renderAttendance();
}

function toggleTeacherAttendance(teacherId, weekId, checked) {
  if (!attState.teacherRecords[teacherId]) attState.teacherRecords[teacherId] = {};
  attState.teacherRecords[teacherId][weekId] = checked;
  saveAttendance(); renderAttendance();
}

/* [수정1] 반별로 스코프된 일괄 출석 체크 */
function bulkCheckClass(classId, weekId) {
  const cls = findClass(classId);
  if (!cls) return;
  cls.members.forEach(m => {
    if (!attState.records[m.id]) attState.records[m.id] = {};
    attState.records[m.id][weekId] = true;
  });
  saveAttendance(); renderAttendance(); toast(`${cls.name} 전원 출석 체크 완료`);
}

function uncheckClass(classId, weekId) {
  const cls = findClass(classId);
  if (!cls) return;
  cls.members.forEach(m => {
    if (!attState.records[m.id]) attState.records[m.id] = {};
    attState.records[m.id][weekId] = false;
  });
  saveAttendance(); renderAttendance(); toast(`${cls.name} 전원 출석 해제 완료`);
}

function bulkCheckTeachers(weekId) {
  state.teachers.forEach(t => {
    if (!attState.teacherRecords[t.id]) attState.teacherRecords[t.id] = {};
    attState.teacherRecords[t.id][weekId] = true;
  });
  saveAttendance(); renderAttendance(); toast("교사 전원 출석 체크 완료");
}

function uncheckTeachers(weekId) {
  state.teachers.forEach(t => {
    if (!attState.teacherRecords[t.id]) attState.teacherRecords[t.id] = {};
    attState.teacherRecords[t.id][weekId] = false;
  });
  saveAttendance(); renderAttendance(); toast("교사 전원 출석 해제 완료");
}

/* 합계 계산 */
function attendanceClasses() { return state.classes.filter(c => c.kind === "regular" || c.kind === "new" || c.kind === "alt"); }
function studentDenominator() { return totalRegular() + findClass("c_alt").members.length; }
function teacherDenominator() { return state.teachers.length; }

function weekStudentCount(weekId) {
  let n = 0;
  attendanceClasses().forEach(c => c.members.forEach(m => { if (attState.records[m.id]?.[weekId]) n++; }));
  return n;
}

function weekTeacherCount(weekId) {
  let n = 0;
  state.teachers.forEach(t => { if (attState.teacherRecords[t.id]?.[weekId]) n++; });
  return n;
}

function weekClassCount(cls, weekId) {
  let s = 0;
  cls.members.forEach(m => { if ((attState.records[m.id] || {})[weekId]) s++; });
  return s;
}

/* ===== 학생 반별 출석 표 ===== */

function attClassTableHtml(cls, weeks) {
  weeks = weeks || attState.weeks;
  if (!cls.members.length) return `<div class="att-class-block"><h3>${escapeHtml(cls.name)}</h3><div class="att-empty">인원 없음</div></div>`;
  const weekHeaders = weeks.map(w => `
    <th class="att-week">${escapeHtml(w.label)}<button class="week-del" title="이 주 삭제" onclick="removeWeek('${w.id}')">×</button>
    <br><button class="bulk-btn" onclick="bulkCheckClass('${cls.id}','${w.id}')">전원✓</button>
    <button class="bulk-btn" style="background:var(--danger);" onclick="uncheckClass('${cls.id}','${w.id}')">전원✗</button></th>`).join("");

  const rows = cls.members.map(m => {
    const rec = attState.records[m.id] || {};
    let total = 0;
    const cells = weeks.map(w => {
      const chk = !!rec[w.id]; if (chk) total++;
      return `<td><input type="checkbox" class="att-check" ${chk?"checked":""} onchange="toggleAttendance('${m.id}','${w.id}',this.checked)"></td>`;
    }).join("");
    return `<tr><td class="att-name">${escapeHtml(m.name)}</td>${cells}<td class="att-total">${total}</td></tr>`;
  }).join("");

  const weekSums = weeks.map(w => `<td>${weekClassCount(cls, w.id)}</td>`).join("");
  const grand = cls.members.reduce((s, m) => s + weeks.reduce((s2, w) => s2 + ((attState.records[m.id]||{})[w.id]?1:0), 0), 0);

  return `<div class="att-class-block"><h3>${escapeHtml(cls.name)} (${cls.members.length}명)</h3>
    <table class="att-table"><tr><th>이름</th>${weekHeaders}<th class="att-total">합계</th></tr>
    ${rows}<tr class="att-sumrow"><td>주별 합계</td>${weekSums}<td>${grand}</td></tr></table></div>`;
}

/* ===== 교사 출석 표 ===== */

function teacherTableHtml(weeks) {
  weeks = weeks || attState.weeks;
  if (!state.teachers.length) return `<div class="att-class-block"><h3>교사</h3><div class="att-empty">교사 없음</div></div>`;
  const weekHeaders = weeks.map(w => `
    <th class="att-week">${escapeHtml(w.label)}<button class="week-del" title="삭제" onclick="removeWeek('${w.id}')">×</button>
    <br><button class="bulk-btn" onclick="bulkCheckTeachers('${w.id}')">전원✓</button>
    <button class="bulk-btn" style="background:var(--danger);" onclick="uncheckTeachers('${w.id}')">전원✗</button></th>`).join("");

  const rows = state.teachers.map(t => {
    const rec = attState.teacherRecords[t.id] || {};
    let total = 0;
    const cells = weeks.map(w => {
      const chk = !!rec[w.id]; if (chk) total++;
      return `<td><input type="checkbox" class="att-check" ${chk?"checked":""} onchange="toggleTeacherAttendance('${t.id}','${w.id}',this.checked)"></td>`;
    }).join("");
    return `<tr><td class="att-name">${escapeHtml(t.name)}</td>${cells}<td class="att-total">${total}</td></tr>`;
  }).join("");

  const weekSums = weeks.map(w => `<td>${weekTeacherCount(w.id)}</td>`).join("");
  const grand = weeks.reduce((s, w) => s + weekTeacherCount(w.id), 0);
  return `<div class="att-class-block teacher-block">
    <h3>👩‍🏫 교사 (${state.teachers.length}명)</h3>
    <table class="att-table"><tr><th>이름</th>${weekHeaders}<th class="att-total">합계</th></tr>
    ${rows}<tr class="att-sumrow"><td>주별 합계</td>${weekSums}<td>${grand}</td></tr></table></div>`;
}

/* ===== 주별 합계 요약 ===== */

function weeklySummaryTableHtml(weeks) {
  weeks = weeks || attState.weeks;
  const sDenom = studentDenominator(), tDenom = teacherDenominator();
  const rows = weeks.map(w => {
    const sC = weekStudentCount(w.id), tC = weekTeacherCount(w.id);
    return `<tr><td class="att-name">${escapeHtml(w.label)}</td><td>${sC} / ${sDenom}명</td><td>${tC} / ${tDenom}명</td></tr>`;
  }).join("");
  return `<div class="att-class-block summary-block"><h3>📊 주별 출석 총합계 (학생 / 교사)</h3>
    <table class="att-table summary-table"><tr><th>주차</th><th>학생 출석 (재적 대비)</th><th>교사 출석 (재적 대비)</th></tr>
    ${rows || `<tr><td colspan="3" class="att-empty">주차 없음</td></tr>`}</table></div>`;
}
/* ===== 출석부 화면 렌더링 ===== */

function renderAttendance() {
  const container = document.getElementById("attendanceContainer");
  let html = calendarHtml();
  const monthWeeks = weeksInMonth(attState.calMonth);
  if (!monthWeeks.length) {
    html += `<div class="att-empty">이번 달에 등록된 출석 주차가 없습니다. (일요일은 자동으로 추가돼요 — 캘린더에서 삭제한 주차만 다시 나타나지 않습니다) 필요하면 "+ 새 주 추가" 버튼으로 직접 추가할 수 있어요.</div>`;
    container.innerHTML = html; bindCalNoteEvents(); return;
  }
  html += weeklySummaryTableHtml(monthWeeks) + teacherTableHtml(monthWeeks);
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  ages.forEach(age => {
    const classesOfAge = state.classes.filter(c => c.kind === "regular" && c.age === age);
    html += `<h2 style="margin:18px 0 8px 4px;color:var(--navy);font-size:16px;">${escapeHtml(age)}</h2>`;
    html += classesOfAge.map(c => attClassTableHtml(c, monthWeeks)).join("");
  });
  const newCls = findClass("c_new");
  if (newCls?.members.length) { html += `<h2 style="margin:18px 0 8px 4px;color:var(--navy);font-size:16px;">${escapeHtml(newCls.name)}</h2>` + attClassTableHtml(newCls, monthWeeks); }
  const altCls = findClass("c_alt");
  if (altCls?.members.length) { html += `<h2 style="margin:18px 0 8px 4px;color:var(--navy);font-size:16px;">별명부</h2>` + attClassTableHtml(altCls, monthWeeks); }
  container.innerHTML = html;
  bindCalNoteEvents();
}

/* ===== [수정2] 출석부 인쇄 - 선택한 주차만, A4 한장 ===== */

function printAttClassTableCompact(cls, weeks) {
  if (!cls.members.length) return "";
  const wh = weeks.map(w => `<th>${escapeHtml(w.label)}</th>`).join("");
  const rows = cls.members.map(m => {
    const rec = attState.records[m.id] || {};
    let total = 0;
    const cells = weeks.map(w => { const c = !!rec[w.id]; if (c) total++; return `<td>${c?"○":""}</td>`; }).join("");
    return `<tr><td class="p-att-name">${escapeHtml(m.name)}</td>${cells}<td class="p-att-total">${total}</td></tr>`;
  }).join("");
  const ws = weeks.map(w => `<td>${weekClassCount(cls, w.id)}</td>`).join("");
  const g = cls.members.reduce((s, m) => s + weeks.reduce((s2, w) => s2 + ((attState.records[m.id]||{})[w.id]?1:0), 0), 0);
  return `<div class="print-class-block"><h3>${escapeHtml(cls.name)} (${cls.members.length}명)</h3>
    <table class="print-table att-print-table"><tr><th>이름</th>${wh}<th>합계</th></tr>${rows}
    <tr style="font-weight:700;background:#eee;"><td>합계</td>${ws}<td>${g}</td></tr></table></div>`;
}

function printTeacherTableCompact(weeks) {
  if (!state.teachers.length) return "";
  const wh = weeks.map(w => `<th>${escapeHtml(w.label)}</th>`).join("");
  const rows = state.teachers.map(t => {
    const rec = attState.teacherRecords[t.id] || {};
    let total = 0;
    const cells = weeks.map(w => { const c = !!rec[w.id]; if (c) total++; return `<td>${c?"○":""}</td>`; }).join("");
    return `<tr><td class="p-att-name">${escapeHtml(t.name)}</td>${cells}<td class="p-att-total">${total}</td></tr>`;
  }).join("");
  const ws = weeks.map(w => `<td>${weekTeacherCount(w.id)}</td>`).join("");
  const g = weeks.reduce((s, w) => s + weekTeacherCount(w.id), 0);
  return `<div class="print-class-block"><h3>교사 (${state.teachers.length}명)</h3>
    <table class="print-table att-print-table"><tr><th>이름</th>${wh}<th>합계</th></tr>${rows}
    <tr style="font-weight:700;background:#eee;"><td>합계</td>${ws}<td>${g}</td></tr></table></div>`;
}

function printSummaryCompact(weeks) {
  const sDenom = studentDenominator(), tDenom = teacherDenominator();
  const rows = weeks.map(w => `<tr><td>${escapeHtml(w.label)}</td><td>${weekStudentCount(w.id)}/${sDenom}</td><td>${weekTeacherCount(w.id)}/${tDenom}</td></tr>`).join("");
  return `<div class="print-class-block"><h3>주별 합계</h3>
    <table class="print-table" style="font-size:8px;"><tr><th>주차</th><th>학생</th><th>교사</th></tr>${rows}</table></div>`;
}

function buildPrintAreaAtt(selectedWeekIds) {
  const container = document.getElementById("printAreaAtt");
  const weeks = selectedWeekIds ? attState.weeks.filter(w => selectedWeekIds.includes(w.id)) : attState.weeks;
  if (!weeks.length) {
    container.innerHTML = `<div class="print-page"><div class="print-header"><div class="p-title">${escapeHtml(state.title)} · 출석부</div></div>
      <p style="font-size:13px;">선택된 주차가 없습니다.</p></div>`;
    return;
  }
  let body = "";
  body += printSummaryCompact(weeks);
  body += printTeacherTableCompact(weeks);
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  ages.forEach(age => {
    state.classes.filter(c => c.kind === "regular" && c.age === age).forEach(c => { body += printAttClassTableCompact(c, weeks); });
  });
  const newCls = findClass("c_new");
  if (newCls?.members.length) body += printAttClassTableCompact(newCls, weeks);
  const altCls = findClass("c_alt");
  if (altCls?.members.length) body += printAttClassTableCompact(altCls, weeks);

  container.innerHTML = `<div class="print-page print-compact">
    <div class="print-header"><div class="p-title">${escapeHtml(state.title)} · 출석부</div>
    <div class="p-date">선택 주차: ${weeks.length}주 · 재적: ${studentDenominator()}명 · 교사: ${teacherDenominator()}명</div></div>
    ${body}</div>`;
}

/* ===== 출석부 인쇄 주차 선택 모달 ===== */

function openAttPrintOpt() {
  if (!attState.weeks.length) { alert("등록된 주차가 없습니다. 먼저 캘린더나 '+ 새 주 추가'로 주차를 추가해주세요."); return; }
  const groups = {}; // "YYYY-MM" -> [week,...] ; 파싱 안되면 "기타"
  attState.weeks.forEach(w => {
    const d = new Date(w.label);
    const key = !isNaN(d.getTime()) ? w.label.slice(0, 7) : "기타";
    if (!groups[key]) groups[key] = [];
    groups[key].push(w);
  });
  const keys = Object.keys(groups).sort();
  const html = keys.map(key => {
    const items = groups[key].map(w => `
      <div class="att-print-week-item">
        <input type="checkbox" class="attp-week-cb" value="${w.id}" checked>
        <label>${escapeHtml(w.label)}</label>
      </div>`).join("");
    const monthLabel = key === "기타" ? "기타" : `${key.split("-")[0]}년 ${parseInt(key.split("-")[1],10)}월`;
    return `<div class="att-print-month-group">
      <div class="month-title">${monthLabel}
        <button class="btn-ghost btn-mini" onclick="attPrintSelectMonth('${key}',true)">이 달 전체</button>
        <button class="btn-ghost btn-mini" onclick="attPrintSelectMonth('${key}',false)">이 달 해제</button>
      </div>
      ${items}
    </div>`;
  }).join("");
  document.getElementById("attPrintWeekList").innerHTML = html;
  document.getElementById("attPrintWeekList").dataset.groups = JSON.stringify(
    Object.fromEntries(keys.map(k => [k, groups[k].map(w => w.id)]))
  );
  document.getElementById("attPrintOptBackdrop").classList.add("open");
}

function closeAttPrintOpt() { document.getElementById("attPrintOptBackdrop").classList.remove("open"); }

function attPrintSelectAll(checked) {
  document.querySelectorAll(".attp-week-cb").forEach(cb => { cb.checked = checked; });
}

function attPrintSelectMonth(monthKey, checked) {
  const groups = JSON.parse(document.getElementById("attPrintWeekList").dataset.groups || "{}");
  const ids = new Set(groups[monthKey] || []);
  document.querySelectorAll(".attp-week-cb").forEach(cb => { if (ids.has(cb.value)) cb.checked = checked; });
}

function doPrintAttendance() {
  const selected = [...document.querySelectorAll(".attp-week-cb:checked")].map(cb => cb.value);
  if (!selected.length) { alert("인쇄할 주차를 1개 이상 선택해주세요."); return; }
  buildPrintAreaAtt(selected);
  closeAttPrintOpt();
  document.body.classList.add("print-att");
  setTimeout(() => window.print(), 100);
}
