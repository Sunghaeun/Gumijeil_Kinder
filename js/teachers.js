/* 선생님 명단 렌더링 및 추가/수정/삭제 */
/* ===== 교사 관리 (선생님 명단 탭) ===== */

let editingTeacherId = null;
let draggedTeacherId = null;

function renderTeacherRoster() {
  const container = document.getElementById("teacherRosterContainer");
  const rows = state.teachers.map(t => teacherRowHtml(t)).join("");
  container.innerHTML = `
  <div class="age-section">
    <div class="age-header"><h2>선생님 명단</h2><div class="meta">등록된 선생님: ${state.teachers.length}명</div></div>
    <div class="class-grid" style="grid-template-columns:1fr;">
      <div class="class-card">
        <div class="class-card-head">
          <div><div class="title">유치부 교사</div><div class="teachers">담임/보조 교사 전체 명단 (⠿ 아이콘을 드래그하면 순서를 바꿀 수 있어요)</div></div>
          <div class="count-badge">${state.teachers.length}명</div>
        </div>
        <ul class="member-list">${rows || `<div class="empty-note">등록된 선생님이 없습니다.</div>`}</ul>
        <div class="add-row"><button class="btn-ghost btn-mini" onclick="openTeacherAddModal()">+ 선생님 추가</button></div>
      </div>
    </div>
  </div>`;
  bindTeacherDragEvents();
}

function formatTeacherDob(t) {
  if (!t.dob) return "";
  const parts = t.dob.split(".");
  if (parts.length < 3) return t.dob;
  const yy = parts[0].trim(), mo = parts[1].trim(), dd = parts[2].trim();
  const calLabel = t.calType === "lunar" ? "(음)" : "";
  if (yy === "00") return `${mo}.${dd}${calLabel} (연도 미상)`;
  return `${yy}.${mo}.${dd}${calLabel}`;
}

function teacherRowHtml(t) {
  const dobDisplay = formatTeacherDob(t);
  const sub = [dobDisplay, t.phone, t.address, t.gender].filter(Boolean).join(" · ");
  return `
  <li class="member-row" data-tid="${t.id}">
    <span class="drag-handle" draggable="true" title="드래그해서 순서 변경">⠿</span>
    <div class="member-main" onclick="toggleTeacherDetail('${t.id}')">
      <div class="member-name">${escapeHtml(t.name)}${genderTag(t.gender)}</div>
      <div class="member-sub">${escapeHtml(sub) || "&nbsp;"}</div>
    </div>
    <div class="member-actions">
      <button class="btn-mini btn-ghost" onclick="openTeacherEditModal('${t.id}')">수정</button>
      <button class="btn-mini btn-ghost" onclick="deleteTeacher('${t.id}')">삭제</button>
    </div>
  </li>
  <div class="detail-panel" id="tdetail-${t.id}">
    <div><span class="lbl">생일</span>${escapeHtml(dobDisplay)||"-"}</div>
    <div><span class="lbl">성별</span>${escapeHtml(t.gender)||"-"}</div>
    <div><span class="lbl">전화번호</span>${escapeHtml(t.phone)||"-"}</div>
    <div><span class="lbl">주소</span>${escapeHtml(t.address)||"-"}</div>
    <div><span class="lbl">비고</span>${escapeHtml(t.note)||"-"}</div>
  </div>`;
}

/* ===== 드래그 앤 드롭으로 선생님 순서 변경 ===== */

function bindTeacherDragEvents() {
  const container = document.getElementById("teacherRosterContainer");
  if (!container) return;

  container.querySelectorAll(".drag-handle").forEach(handle => {
    handle.addEventListener("dragstart", (e) => {
      const li = handle.closest(".member-row");
      if (!li) return;
      draggedTeacherId = li.dataset.tid;
      e.dataTransfer.effectAllowed = "move";
      try { e.dataTransfer.setData("text/plain", draggedTeacherId); } catch (err) {}
      try { e.dataTransfer.setDragImage(li, 20, 20); } catch (err) {}
      li.classList.add("dragging");
    });
    handle.addEventListener("dragend", () => {
      container.querySelectorAll(".member-row").forEach(li => li.classList.remove("dragging", "drag-over-top", "drag-over-bottom"));
      draggedTeacherId = null;
    });
  });

  container.querySelectorAll(".member-row[data-tid]").forEach(li => {
    li.addEventListener("dragover", (e) => {
      if (!draggedTeacherId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = li.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      li.classList.toggle("drag-over-top", before);
      li.classList.toggle("drag-over-bottom", !before);
    });
    li.addEventListener("dragleave", () => {
      li.classList.remove("drag-over-top", "drag-over-bottom");
    });
    li.addEventListener("drop", (e) => {
      e.preventDefault();
      li.classList.remove("drag-over-top", "drag-over-bottom");
      const targetId = li.dataset.tid;
      if (!draggedTeacherId || draggedTeacherId === targetId) return;
      const rect = li.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      reorderTeacher(draggedTeacherId, targetId, before);
    });
  });
}

function reorderTeacher(draggedId, targetId, before) {
  const fromIdx = state.teachers.findIndex(t => t.id === draggedId);
  if (fromIdx === -1) return;
  const [moved] = state.teachers.splice(fromIdx, 1);
  let toIdx = state.teachers.findIndex(t => t.id === targetId);
  if (toIdx === -1) toIdx = state.teachers.length;
  else if (!before) toIdx += 1;
  state.teachers.splice(toIdx, 0, moved);
  saveState(); render();
  toast(`${moved.name} 선생님 순서를 변경했습니다.`);
}

function toggleTeacherDetail(tid) { const el = document.getElementById("tdetail-" + tid); if (el) el.classList.toggle("open"); }

function openTeacherAddModal() {
  editingTeacherId = null;
  document.getElementById("teacherModalTitle").textContent = "선생님 추가";
  ["tFName","tFPhone","tFAddress","tFNote"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("tFDob").value = "";
  document.getElementById("tFDobUnknownYear").checked = false;
  document.getElementById("tFGender").value = "";
  document.getElementById("tFCalType").value = "solar";
  document.getElementById("teacherModalBackdrop").classList.add("open");
  document.getElementById("tFName").focus();
}

function openTeacherEditModal(tid) {
  const t = state.teachers.find(x => x.id === tid); if (!t) return;
  editingTeacherId = tid;
  document.getElementById("teacherModalTitle").textContent = "선생님 정보 수정";
  document.getElementById("tFName").value = t.name || "";
  const isUnknownYear = !!(t.dob && t.dob.split(".")[0].trim() === "00");
  document.getElementById("tFDobUnknownYear").checked = isUnknownYear;
  document.getElementById("tFDob").value = dotDobToIso(t.dob, 1900);
  document.getElementById("tFCalType").value = t.calType || "solar";
  document.getElementById("tFGender").value = t.gender || "";
  document.getElementById("tFPhone").value = t.phone || "";
  document.getElementById("tFAddress").value = t.address || "";
  document.getElementById("tFNote").value = t.note || "";
  document.getElementById("teacherModalBackdrop").classList.add("open");
  document.getElementById("tFName").focus();
}

function closeTeacherModal() { document.getElementById("teacherModalBackdrop").classList.remove("open"); editingTeacherId = null; }

function saveTeacherModal() {
  const name = document.getElementById("tFName").value.trim();
  if (!name) { alert("이름을 입력해주세요."); return; }
  const unknownYear = document.getElementById("tFDobUnknownYear").checked;
  const d = {
    name,
    dob: isoDobToDot(document.getElementById("tFDob").value, unknownYear),
    calType: document.getElementById("tFCalType").value,
    gender: document.getElementById("tFGender").value,
    phone: document.getElementById("tFPhone").value.trim(),
    address: document.getElementById("tFAddress").value.trim(),
    note: document.getElementById("tFNote").value.trim()
  };
  if (editingTeacherId) {
    const t = state.teachers.find(x => x.id === editingTeacherId);
    if (t) Object.assign(t, d);
    toast(`${name} 선생님 정보를 저장했습니다.`);
  } else {
    state.teachers.push({ id: genTeacherId(), ...d });
    toast(`${name} 선생님을 추가했습니다.`);
  }
  saveState(); render(); closeTeacherModal();
}

function deleteTeacher(tid) {
  const t = state.teachers.find(x => x.id === tid); if (!t) return;
  if (!confirm(`'${t.name}' 선생님을 삭제할까요?`)) return;
  state.teachers = state.teachers.filter(x => x.id !== tid);
  if (attState.teacherRecords) delete attState.teacherRecords[tid];
  saveState(); saveAttendance(); render(); toast(`${t.name} 선생님을 삭제했습니다.`);
}

/* ===== 선생님 명단 인쇄 (반별명단 인쇄와 동일하게 인쇄 항목을 선택할 수 있습니다) ===== */

function openTeacherPrintOpt() { document.getElementById("teacherPrintOptBackdrop").classList.add("open"); }
function closeTeacherPrintOpt() { document.getElementById("teacherPrintOptBackdrop").classList.remove("open"); }

function buildPrintAreaTeachers(opts) {
  if (!opts) opts = { dob: true, phone: true, address: false, gender: false, note: false };
  const container = document.getElementById("printAreaTeachers");
  if (!container) return;
  const cols = [{ label: "이름", key: "name" }];
  if (opts.dob) cols.push({ label: "생일", key: "_dob" });
  if (opts.phone) cols.push({ label: "전화번호", key: "phone" });
  if (opts.address) cols.push({ label: "주소", key: "address" });
  if (opts.gender) cols.push({ label: "성별", key: "gender" });
  if (opts.note) cols.push({ label: "비고", key: "note" });

  const ths = cols.map(c => `<th>${c.label}</th>`).join("");
  const rows = state.teachers.map(t => {
    const tds = cols.map(c => {
      const v = c.key === "_dob" ? formatTeacherDob(t) : t[c.key];
      return `<td>${escapeHtml(v) || "-"}</td>`;
    }).join("");
    return `<tr>${tds}</tr>`;
  }).join("");

  container.innerHTML = `<div class="print-page"><div class="print-header">
    <div class="p-title">${escapeHtml(state.title)} · 선생님 명단 (${state.teachers.length}명)</div>
    <div class="p-date">기준일: ${escapeHtml(state.updated)}</div></div>
    <table class="print-table">
      <tr>${ths}</tr>
      ${rows || `<tr><td colspan="${cols.length}" style="text-align:center;color:#666;">등록된 선생님이 없습니다.</td></tr>`}
    </table></div>`;
}

function doPrintTeachers() {
  const opts = {
    dob: document.getElementById("tpDob").checked,
    phone: document.getElementById("tpPhone").checked,
    address: document.getElementById("tpAddress").checked,
    gender: document.getElementById("tpGender").checked,
    note: document.getElementById("tpNote").checked
  };
  buildPrintAreaTeachers(opts);
  closeTeacherPrintOpt();
  document.body.classList.add("print-teachers");
  setTimeout(() => window.print(), 100);
}
