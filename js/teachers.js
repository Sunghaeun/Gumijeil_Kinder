/* 선생님 명단 렌더링 및 추가/수정/삭제 */
/* ===== 교사 관리 (선생님 명단 탭) ===== */

let editingTeacherId = null;

function renderTeacherRoster() {
  const container = document.getElementById("teacherRosterContainer");
  const rows = state.teachers.map(t => teacherRowHtml(t)).join("");
  container.innerHTML = `
  <div class="age-section">
    <div class="age-header"><h2>선생님 명단</h2><div class="meta">등록된 선생님: ${state.teachers.length}명</div></div>
    <div class="class-grid" style="grid-template-columns:1fr;">
      <div class="class-card">
        <div class="class-card-head">
          <div><div class="title">유치부 교사</div><div class="teachers">담임/보조 교사 전체 명단</div></div>
          <div class="count-badge">${state.teachers.length}명</div>
        </div>
        <ul class="member-list">${rows || `<div class="empty-note">등록된 선생님이 없습니다.</div>`}</ul>
        <div class="add-row"><button class="btn-ghost btn-mini" onclick="openTeacherAddModal()">+ 선생님 추가</button></div>
      </div>
    </div>
  </div>`;
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

/* ===== 선생님 명단 인쇄 ===== */

function buildPrintAreaTeachers() {
  const container = document.getElementById("printAreaTeachers");
  if (!container) return;
  const rows = state.teachers.map(t => `
    <tr>
      <td>${escapeHtml(t.name) || "-"}</td>
      <td>${escapeHtml(formatTeacherDob(t)) || "-"}</td>
      <td>${escapeHtml(t.gender) || "-"}</td>
      <td>${escapeHtml(t.phone) || "-"}</td>
      <td>${escapeHtml(t.address) || "-"}</td>
      <td>${escapeHtml(t.note) || "-"}</td>
    </tr>`).join("");
  container.innerHTML = `<div class="print-page"><div class="print-header">
    <div class="p-title">${escapeHtml(state.title)} · 선생님 명단 (${state.teachers.length}명)</div>
    <div class="p-date">기준일: ${escapeHtml(state.updated)}</div></div>
    <table class="print-table">
      <tr><th>이름</th><th>생일</th><th>성별</th><th>전화번호</th><th>주소</th><th>비고</th></tr>
      ${rows || `<tr><td colspan="6" style="text-align:center;color:#666;">등록된 선생님이 없습니다.</td></tr>`}
    </table></div>`;
}

function doPrintTeachers() {
  buildPrintAreaTeachers();
  document.body.classList.add("print-teachers");
  setTimeout(() => window.print(), 100);
}
