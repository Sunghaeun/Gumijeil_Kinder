/* 출석부: 주차 관리, 체크, 합계 계산, 렌더링, 인쇄 */
/* ============================================================
   출석부 (학생/교사 출석 + 캘린더 + 생일 + 일괄 출석)
   ============================================================ */

/* attState는 main.js의 초기화(init) 단계, 또는 연도를 전환할 때 서버로부터 비동기로
   불러온 뒤 채워집니다. 반별명단과 마찬가지로 "attendance_2026"처럼 연도별 키로 저장합니다
   - 사람(member) id가 연도마다 새로 매겨지기 때문에(같은 id "m1"이라도 연도마다 다른
   아이를 가리킬 수 있음), 출석부를 연도별로 나누지 않으면 다른 연도끼리 출석 체크가
   서로 뒤섞여 보이는 문제가 생깁니다. */
let attState = null;

function attendanceKeyForYear(year) { return `attendance_${year}`; }

function defaultAttendanceState(year) {
  const now = new Date();
  const realCurrentYear = now.getFullYear();
  const calMonth = (year === undefined || year === realCurrentYear)
    ? now.toISOString().slice(0, 7)
    : `${year}-01`;
  return { weeks: [], records: {}, teacherRecords: {}, parentCounts: {}, calMonth, dateNotes: {}, freeNotes: [], autoInitedMonths: [] };
}

/* [변경] localStorage 대신 서버(API)에서, 연도별 키로 불러옵니다. */
async function loadAttendance(year) {
  try {
    const p = await apiGet(attendanceKeyForYear(year));
    if (p && Array.isArray(p.weeks) && p.records) {
      if (!p.teacherRecords) p.teacherRecords = {};
      if (!p.parentCounts) p.parentCounts = {};
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

      // [재적 인원 스냅샷 보정] 예전에 만들어진 주차는 "그 주 시점 재적 인원수"가 저장되어
      //있지 않으므로, 지금 이 순간의 재적 인원으로 한 번 얼려서(snapshot) 채워줍니다.
      // 이후로는 반/선생님 명단이 바뀌어도 이 주차의 숫자는 더 이상 안 바뀝니다.
      // (이 시점 이전 과거의 정확한 인원수까지 되살릴 수는 없지만, 적어도 지금부터는
      // 반/교사 명단을 바꿔도 지난 주차 숫자가 계속 흔들리는 문제는 사라집니다.)
      let backfilled = false;
      p.weeks.forEach(w => {
        if (typeof w.studentDenom !== "number" || typeof w.teacherDenom !== "number") {
          w.studentDenom = studentDenominator();
          w.teacherDenom = teacherDenominator();
          backfilled = true;
        }
      });
      if (backfilled && typeof metaState !== "undefined" && metaState && year === metaState.currentYear) {
        apiPut(attendanceKeyForYear(year), p).catch(() => {});
      }
      return p;
    }
  } catch (e) {
    console.error("출석부 불러오기 실패, 빈 데이터로 시작합니다.", e);
  }
  return defaultAttendanceState(year);
}

/* [변경] localStorage 대신 서버(API)로, 연도별 키에 저장합니다. 지난 연도를 보는 중이면
   반별명단과 마찬가지로 저장하지 않습니다(출석부도 그 연도의 명단에 딸린 자료이므로). */
function saveAttendance() {
  if (!attState) return;
  if (!isViewingCurrentYear()) {
    toast("⚠ 지난 연도 출석부는 수정할 수 없습니다.");
    return;
  }
  apiPut(attendanceKeyForYear(viewYear), attState).catch(() => toast("⚠ 저장 실패 - 인터넷 연결을 확인하세요."));
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
  const week = { id, label: dateStr };
  snapshotWeekDenom(week); // 이 주차가 생기는 "지금" 시점의 재적 인원수를 그대로 얼려둡니다.
  attState.weeks.push(week);
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
  if (!guardEditable()) return;
  const suggested = suggestNextWeekLabel();
  const label = prompt("추가할 주의 날짜를 입력하세요 (예: 2026-01-04)", suggested);
  if (label === null) return;
  const id = "w" + Date.now();
  const week = { id, label: label.trim() || suggested || ("주 " + (attState.weeks.length + 1)) };
  snapshotWeekDenom(week);
  attState.weeks.push(week);
  saveAttendance(); renderAttendance(); toast("새로운 주가 추가되었습니다.");
}

function removeWeek(weekId) {
  if (!guardEditable()) return;
  const wk = attState.weeks.find(w => w.id === weekId); if (!wk) return;
  if (!confirm(`'${wk.label}' 주차를 삭제할까요?`)) return;
  attState.weeks = attState.weeks.filter(w => w.id !== weekId);
  Object.values(attState.records).forEach(rec => { delete rec[weekId]; });
  Object.values(attState.teacherRecords).forEach(rec => { delete rec[weekId]; });
  if (attState.parentCounts) delete attState.parentCounts[weekId];
  saveAttendance(); renderAttendance();
}

function toggleAttendance(memberId, weekId, checked) {
  if (!guardEditable()) return;
  if (!attState.records[memberId]) attState.records[memberId] = {};
  attState.records[memberId][weekId] = checked;
  saveAttendance(); renderAttendance();
}

function toggleTeacherAttendance(teacherId, weekId, checked) {
  if (!guardEditable()) return;
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

/* [수정3-3] 전원✓ / 전원✗ 버튼 2개를 하나의 on/off 토글 버튼으로 통합 */
function weekClassAllChecked(cls, weekId) {
  if (!cls.members.length) return false;
  return cls.members.every(m => !!(attState.records[m.id] || {})[weekId]);
}
function toggleBulkClass(classId, weekId) {
  if (!guardEditable()) return;
  const cls = findClass(classId); if (!cls) return;
  if (weekClassAllChecked(cls, weekId)) uncheckClass(classId, weekId);
  else bulkCheckClass(classId, weekId);
}
function weekTeachersAllChecked(weekId) {
  if (!state.teachers.length) return false;
  return state.teachers.every(t => !!(attState.teacherRecords[t.id] || {})[weekId]);
}
function toggleBulkTeachers(weekId) {
  if (!guardEditable()) return;
  if (weekTeachersAllChecked(weekId)) uncheckTeachers(weekId);
  else bulkCheckTeachers(weekId);
}

/* 합계 계산 */
function attendanceClasses() { return state.classes.filter(c => c.kind === "regular" || c.kind === "new" || c.kind === "alt"); }
function studentDenominator() { return totalRegular() + findClass("c_alt").members.length; }
function teacherDenominator() { return state.teachers.length; }

/* ===== 주차별 "그 시점 재적 인원수" 스냅샷 =====
   등반/별명부 이동/삭제 등으로 반별명단이 바뀌면 studentDenominator()/teacherDenominator()의
   값도 즉시 바뀌는데, 여기에만 의존하면 이미 지난 주차들의 "재적 대비 출석" 표시까지 전부
   지금 인원수로 다시 계산되어 버립니다(예: 이번 주에 새 아이가 등반하면 지난달 주차까지
   전부 +1명으로 보임). 그래서 각 주차가 "만들어질 때"와 "그 이후로 반/교사 명단이 바뀔 때"의
   인원수를 week.studentDenom / week.teacherDenom에 그대로 얼려서 저장하고, 화면/인쇄 모두
   이 스냅샷 값을 우선 사용합니다. */
function snapshotWeekDenom(week) {
  week.studentDenom = studentDenominator();
  week.teacherDenom = teacherDenominator();
}

function weekStudentDenom(week) {
  return (week && typeof week.studentDenom === "number") ? week.studentDenom : studentDenominator();
}

function weekTeacherDenom(week) {
  return (week && typeof week.teacherDenom === "number") ? week.teacherDenom : teacherDenominator();
}

/* 반별명단/선생님 명단이 바뀔 때마다(js/data.js의 saveState()에서) 호출합니다.
   이미 지난(오늘보다 이전 날짜) 주차의 스냅샷은 그대로 두고, 오늘 및 이후 주차만 최신
   인원수로 다시 얼립니다 - "바뀌기 전 주는 그대로, 바뀐 주부터는 새 인원수로" 요구사항. */
function syncFutureWeekDenoms() {
  if (!attState || !Array.isArray(attState.weeks) || !attState.weeks.length) return;
  const today = todayStr();
  let changed = false;
  attState.weeks.forEach(w => {
    if (typeof w.label === "string" && w.label >= today) {
      const newS = studentDenominator(), newT = teacherDenominator();
      if (w.studentDenom !== newS || w.teacherDenom !== newT) changed = true;
      w.studentDenom = newS;
      w.teacherDenom = newT;
    }
  });
  if (changed) saveAttendance();
}

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
  const weekHeaders = weeks.map(w => {
    const allChecked = weekClassAllChecked(cls, w.id);
    return `
    <th class="att-week">${escapeHtml(w.label)}<button class="week-del edit-only-btn" title="이 주 삭제" onclick="removeWeek('${w.id}')">×</button>
    <br><button class="bulk-btn edit-only-btn ${allChecked ? "bulk-btn-on" : ""}" onclick="toggleBulkClass('${cls.id}','${w.id}')">${allChecked ? "전원 해제" : "전원 출석"}</button></th>`;
  }).join("");

  const rows = cls.members.map(m => {
    const rec = attState.records[m.id] || {};
    let total = 0;
    const cells = weeks.map(w => {
      const chk = !!rec[w.id]; if (chk) total++;
      return `<td><input type="checkbox" class="att-check" ${chk?"checked":""} ${isViewingCurrentYear()?"":"disabled"} onchange="toggleAttendance('${m.id}','${w.id}',this.checked)"></td>`;
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
  const weekHeaders = weeks.map(w => {
    const allChecked = weekTeachersAllChecked(w.id);
    return `
    <th class="att-week">${escapeHtml(w.label)}<button class="week-del edit-only-btn" title="삭제" onclick="removeWeek('${w.id}')">×</button>
    <br><button class="bulk-btn edit-only-btn ${allChecked ? "bulk-btn-on" : ""}" onclick="toggleBulkTeachers('${w.id}')">${allChecked ? "전원 해제" : "전원 출석"}</button></th>`;
  }).join("");

  const rows = state.teachers.map(t => {
    const rec = attState.teacherRecords[t.id] || {};
    let total = 0;
    const cells = weeks.map(w => {
      const chk = !!rec[w.id]; if (chk) total++;
      return `<td><input type="checkbox" class="att-check" ${chk?"checked":""} ${isViewingCurrentYear()?"":"disabled"} onchange="toggleTeacherAttendance('${t.id}','${w.id}',this.checked)"></td>`;
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

/* ===== 주별 부모님 참석 인원 (이름 없이 숫자만) ===== */

function getParentCount(weekId) { return (attState.parentCounts || {})[weekId] || 0; }

function setParentCount(weekId, rawVal) {
  if (!guardEditable()) return;
  const val = Math.max(0, parseInt(rawVal, 10) || 0);
  if (!attState.parentCounts) attState.parentCounts = {};
  attState.parentCounts[weekId] = val;
  saveAttendance(); renderAttendance();
}

function parentCountTableHtml(weeks) {
  weeks = weeks || attState.weeks;
  const cells = weeks.map(w => `
    <td><input type="number" min="0" step="1" class="parent-count-input" value="${getParentCount(w.id)}"
      ${isViewingCurrentYear() ? "" : "disabled"} onchange="setParentCount('${w.id}', this.value)"></td>`).join("");
  return `<div class="att-class-block parent-count-block">
    <h3>👪 주별 부모님 참석 인원 </h3>
    <table class="att-table">
      <tr><th>구분</th>${weeks.map(w => `<th class="att-week">${escapeHtml(w.label)}</th>`).join("")}</tr>
      <tr><td class="att-name">부모님 수</td>${cells}</tr>
    </table>
  </div>`;
}

/* ===== 주별 합계 요약 ===== */

function weeklySummaryTableHtml(weeks) {
  weeks = weeks || attState.weeks;
  const rows = weeks.map(w => {
    const sC = weekStudentCount(w.id), tC = weekTeacherCount(w.id);
    const sDenom = weekStudentDenom(w), tDenom = weekTeacherDenom(w);
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
  html += weeklySummaryTableHtml(monthWeeks) + teacherTableHtml(monthWeeks) + parentCountTableHtml(monthWeeks);
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
  const rows = weeks.map(w => `<tr><td>${escapeHtml(w.label)}</td><td>${weekStudentCount(w.id)}/${weekStudentDenom(w)}</td><td>${weekTeacherCount(w.id)}/${weekTeacherDenom(w)}</td></tr>`).join("");
  return `<div class="print-class-block"><h3>주별 합계</h3>
    <table class="print-table" style="font-size:8px;"><tr><th>주차</th><th>학생</th><th>교사</th></tr>${rows}</table></div>`;
}

/* [수정3-2] 주차를 1개만 선택했을 때: 사진 속 종이 출석체크표처럼 나이별 4칼럼(3개 연령 + 교사)
   레이아웃으로 한 장(A4)에 인쇄합니다. 별명부 인원은 원래 소속됐던 반의 나이 칼럼 맨 아래에
   포함되고, 신입반 인원은 교사 칼럼 아래쪽에 별도 블록으로 모아서 보여줍니다. */
function ageColumnCountLabel(age) { return escapeHtml(age); }

function formatKoreanDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월${d.getDate()}일`;
}

function singleWeekAgeColumnHtml(age, weekId) {
  const classesOfAge = state.classes.filter(c => c.kind === "regular" && c.age === age);
  const altMembers = findClass("c_alt").members.filter(m => {
    const origin = m._fromClass ? findClass(m._fromClass) : null;
    return origin && origin.age === age;
  });
  let rows = "";
  let total = 0;
  classesOfAge.forEach(c => {
    total += c.members.length;
    if (!c.members.length) return;
    rows += c.members.map((m, i) => {
      const checked = !!(attState.records[m.id] || {})[weekId];
      const clsCell = i === 0 ? `<td class="sw-clsname" rowspan="${c.members.length}">${escapeHtml(c.name)}(${c.members.length})</td>` : "";
      return `<tr>${clsCell}<td class="sw-name">${escapeHtml(m.name)}</td><td class="sw-check">${checked ? "○" : ""}</td></tr>`;
    }).join("");
  });
  if (altMembers.length) {
    total += altMembers.length;
    rows += altMembers.map((m, i) => {
      const checked = !!(attState.records[m.id] || {})[weekId];
      const clsCell = i === 0 ? `<td class="sw-clsname" rowspan="${altMembers.length}">별명(${altMembers.length})</td>` : "";
      return `<tr>${clsCell}<td class="sw-name">${escapeHtml(m.name)}</td><td class="sw-check">${checked ? "○" : ""}</td></tr>`;
    }).join("");
  }
  return `<div class="sw-col">
    <table class="sw-table">
      <tr><th>${ageColumnCountLabel(age)}</th><th>이름</th><th>확인</th></tr>
      ${rows}
    </table>
    <div class="sw-colfoot">총 ${escapeHtml(age)} ${total}명</div>
  </div>`;
}

function singleWeekTeacherColumnHtml(weekId) {
  const newCls = findClass("c_new");
  const rows = state.teachers.map((t, i) => {
    const checked = !!(attState.teacherRecords[t.id] || {})[weekId];
    return `<tr><td class="sw-num">${i + 1}</td><td class="sw-name">${escapeHtml(t.name)}</td><td class="sw-check">${checked ? "○" : ""}</td></tr>`;
  }).join("");
  let newRows = "";
  if (newCls && newCls.members.length) {
    newRows = `<tr><td colspan="3" class="sw-subhead">신입 (${newCls.members.length})</td></tr>` +
      newCls.members.map(m => {
        const checked = !!(attState.records[m.id] || {})[weekId];
        return `<tr><td></td><td class="sw-name">${escapeHtml(m.name)}</td><td class="sw-check">${checked ? "○" : ""}</td></tr>`;
      }).join("");
  }
  return `<div class="sw-col">
    <table class="sw-table">
      <tr><th>번호</th><th>교사</th><th>확인</th></tr>
      ${rows}
      ${newRows}
    </table>
    <div class="sw-colfoot">총 교사 ${state.teachers.length}명</div>
  </div>`;
}

function buildSingleWeekAttSheet(week) {
  const container = document.getElementById("printAreaAtt");
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  const cols = ages.map(age => singleWeekAgeColumnHtml(age, week.id)).join("") + singleWeekTeacherColumnHtml(week.id);
  const sC = weekStudentCount(week.id), tC = weekTeacherCount(week.id), pC = getParentCount(week.id);
  const sDenom = weekStudentDenom(week), tDenom = weekTeacherDenom(week);
  const grandTotal = sC + tC + pC;

  container.innerHTML = `<div class="print-page single-week-page">
    <div class="print-header"><div class="p-title">${escapeHtml(state.title)} 출석체크표</div>
    <div class="p-date">${formatKoreanDate(week.label)}</div></div>
    <div class="single-week-grid">${cols}</div>
    <table class="sw-summary-table">
      <tr><th>학생</th><td>${sC} / ${sDenom}명</td><th>교사</th><td>${tC} / ${tDenom}명</td><th>부모</th><td>${pC}명</td><th>합계</th><td>${grandTotal}명</td></tr>
    </table>
  </div>`;
}

function buildPrintAreaAtt(selectedWeekIds) {
  const container = document.getElementById("printAreaAtt");
  const weeks = selectedWeekIds ? attState.weeks.filter(w => selectedWeekIds.includes(w.id)) : attState.weeks;
  if (!weeks.length) {
    container.innerHTML = `<div class="print-page"><div class="print-header"><div class="p-title">${escapeHtml(state.title)} · 출석부</div></div>
      <p style="font-size:13px;">선택된 주차가 없습니다.</p></div>`;
    return;
  }
  if (weeks.length === 1) { buildSingleWeekAttSheet(weeks[0]); return; }
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

/* ===== [수정1/3] 출석부 인쇄 주차 선택 모달 - 월을 먼저 고르고, 그 달의 주차만 체크박스로 표시 ===== */

function openAttPrintOpt() {
  if (!attState.weeks.length) { alert("등록된 주차가 없습니다. 먼저 캘린더나 '+ 새 주 추가'로 주차를 추가해주세요."); return; }
  document.getElementById("attPrintMonth").value = attState.calMonth;
  renderAttPrintWeekList(attState.calMonth);
  document.getElementById("attPrintOptBackdrop").classList.add("open");
}

/* [수정0] 여러 주차를 체크박스로 다중 선택하던 것을, 라디오 버튼으로 "한 주만" 고르도록
   바꿨습니다 (한 주 인쇄가 훨씬 자주 쓰이고, 한 장짜리 4칼럼 인쇄도 한 주일 때만 되므로). */
function renderAttPrintWeekList(ym) {
  const weeks = weeksInMonth(ym);
  const html = weeks.length
    ? weeks.map((w, i) => `
      <div class="att-print-week-item">
        <input type="radio" name="attpWeek" class="attp-week-radio" value="${w.id}" ${i === 0 ? "checked" : ""}>
        <label>${escapeHtml(w.label)}</label>
      </div>`).join("")
    : `<div class="att-empty">이 달에 등록된 출석 주차가 없습니다.</div>`;
  document.getElementById("attPrintWeekList").innerHTML = html;
}

function attPrintMonthChanged() {
  const ym = document.getElementById("attPrintMonth").value;
  if (ym) renderAttPrintWeekList(ym);
}

function closeAttPrintOpt() { document.getElementById("attPrintOptBackdrop").classList.remove("open"); }

function doPrintAttendance() {
  const selected = document.querySelector(".attp-week-radio:checked");
  if (!selected) { alert("인쇄할 주차를 선택해주세요."); return; }
  buildPrintAreaAtt([selected.value]);
  closeAttPrintOpt();
  document.body.classList.add("print-att");
  setTimeout(() => window.print(), 100);
}
