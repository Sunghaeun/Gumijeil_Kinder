/* 반별 명단 렌더링, 추가/수정/삭제/이동, 명단 인쇄 */
/* ===== 렌더링 ===== */

function render() {
  document.body.classList.toggle("readonly-year", !isViewingCurrentYear());
  renderYearSelector();
  renderStats(); renderAgeGroups();
  renderSpecialCard("newClassContainer", findClass("c_new"), "new-card");
  renderSpecialCard("altListContainer", findClass("c_alt"), "alt-card");
  renderFootnote(); populateClassSelect(); populateAgeDatalist();
  renderTeacherRoster();
  buildPrintArea(); renderAttendance(); buildPrintAreaAtt(); buildPrintAreaTeachers();
}

/* 헤더의 연도 드롭다운/읽기전용 배지를 그립니다. */
function renderYearSelector() {
  const sel = document.getElementById("yearSelect");
  const badge = document.getElementById("yearReadonlyBadge");
  if (!sel || !metaState) return;
  const sortedYears = [...metaState.years].sort((a, b) => b - a);
  sel.innerHTML = sortedYears.map(y =>
    `<option value="${y}"${y === viewYear ? " selected" : ""}>${y}년${y === metaState.currentYear ? " (현재)" : ""}</option>`
  ).join("");
  if (badge) badge.style.display = isViewingCurrentYear() ? "none" : "";
}

function renderStats() {
  const regular = totalRegular(), alt = findClass("c_alt").members.length, newer = findClass("c_new").members.length;
  document.getElementById("statsBar").innerHTML = `
    <span>재적 <b>${regular}</b>명</span><span>별명부 <b>${alt}</b>명</span>
    <span>신입반 <b>${newer}</b>명</span><span>전체 <b>${regular + alt}</b>명 (신입 포함 총 <b>${regular + alt + newer}</b>명)</span>`;
}

function renderFootnote() {
  document.getElementById("pageTitle").textContent = state.title;
  document.getElementById("pageSub").textContent = "기준일: " + state.updated;
  document.getElementById("footnoteBox").innerHTML =
    escapeHtml(state.footnote) + `<br><span class="summary">원본 기준: ${escapeHtml(state.summary)}</span>`;
}

function genderTag(g) { return g === "남" ? '<span class="g-m">(남)</span>' : g === "여" ? '<span class="g-f">(여)</span>' : ""; }
function memberSubLine(m) { return [m.dob, m.phone, m.address].filter(Boolean).join(" · "); }

function memberRowHtml(cls, m) {
  return `
  <li class="member-row" data-mid="${m.id}">
    <div class="member-main" onclick="toggleDetail('${m.id}')">
      <div class="member-name">${escapeHtml(m.name) || "(이름없음)"}${genderTag(m.gender)}</div>
      <div class="member-sub">${escapeHtml(memberSubLine(m)) || "&nbsp;"}</div>
    </div>
    <div class="member-actions">
      <button class="btn-mini btn-ghost edit-only-btn" onclick="openMoveClassFlow('${m.id}')" title="반 이동">🔀</button>
      <button class="btn-mini btn-ghost edit-only-btn" onclick="openEditModal('${m.id}')">수정</button>
      <button class="btn-mini btn-ghost edit-only-btn" onclick="deleteMember('${m.id}')">삭제</button>
    </div>
  </li>
  <div class="detail-panel" id="detail-${m.id}">
    <div><span class="lbl">생년월일</span>${escapeHtml(m.dob)||"-"}</div>
    <div><span class="lbl">성별</span>${escapeHtml(m.gender)||"-"}</div>
    <div><span class="lbl">전화번호</span>${escapeHtml(m.phone)||"-"}</div>
    <div><span class="lbl">주소</span>${escapeHtml(m.address)||"-"}</div>
    <div><span class="lbl">비고</span>${escapeHtml(m.note)||"-"}</div>
  </div>`;
}

function classCardHtml(cls, extraClass) {
  const teacherStr = cls.teachers && cls.teachers.length ? "담당: " + cls.teachers.join(", ") : "";
  const membersHtml = cls.members.length
    ? `<ul class="member-list">${cls.members.map(m => memberRowHtml(cls, m)).join("")}</ul>`
    : `<div class="empty-note">등록된 인원이 없습니다.</div>`;
  const classActions = cls.kind === "regular" ? `
    <div class="class-head-actions">
      <button class="btn-mini btn-ghost edit-only-btn" onclick="openClassModal('${cls.id}')" title="반 정보 수정">✏️</button>
      <button class="btn-mini btn-ghost edit-only-btn" onclick="deleteClass('${cls.id}')" title="반 삭제">🗑</button>
    </div>` : "";
  return `
  <div class="class-card ${extraClass || ""}" data-cid="${cls.id}">
    <div class="class-card-head"><div><div class="title">${escapeHtml(cls.name)}</div><div class="teachers">${escapeHtml(teacherStr)}</div></div>
    <div class="card-head-right"><div class="count-badge">${cls.members.length}명</div>${classActions}</div></div>
    ${membersHtml}
    <div class="add-row edit-only-btn"><button class="btn-ghost btn-mini" onclick="openAddModal('${cls.id}')">+ 이 반에 사람 추가</button></div>
  </div>`;
}

function renderAgeGroups() {
  const container = document.getElementById("ageGroupsContainer");
  container.innerHTML = "";
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  ages.forEach(age => {
    const classesOfAge = state.classes.filter(c => c.kind === "regular" && c.age === age);
    const total = classesOfAge.reduce((s, c) => s + c.members.length, 0);
    const section = document.createElement("div");
    section.className = "age-section";
    section.innerHTML = `<div class="age-header"><h2>${escapeHtml(age)}</h2><div class="meta">현재 ${total}명</div></div>
      <div class="class-grid">${classesOfAge.map(c => classCardHtml(c)).join("")}</div>`;
    container.appendChild(section);
  });
}

function renderSpecialCard(containerId, cls, extraClass) {
  const heading = cls.kind === "new" ? "신입반 (미배정 / 등록 대기)" : "별명부 (장기 결석 이적자)";
  document.getElementById(containerId).innerHTML = `
    <div class="age-section"><div class="age-header"><h2>${heading}</h2><div class="meta">${cls.members.length}명</div></div>
    <div class="class-grid" style="grid-template-columns:1fr;">${classCardHtml(cls, extraClass)}</div></div>`;
}

function populateClassSelect() {
  const sel = document.getElementById("fClass");
  sel.innerHTML = "";
  state.classes.forEach(c => {
    const label = c.kind === "regular" ? `${c.age} ${c.name}` : c.name;
    const opt = document.createElement("option"); opt.value = c.id; opt.textContent = label; sel.appendChild(opt);
  });
}

function populateAgeDatalist() {
  const dl = document.getElementById("ageOptions");
  if (!dl) return;
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  dl.innerHTML = ages.map(age => `<option value="${escapeHtml(age)}"></option>`).join("");
}

/* ===== [수정1] 인쇄 옵션 모달 & 동적 프린트 ===== */

function openPrintOpt() { document.getElementById("printOptBackdrop").classList.add("open"); }
function closePrintOpt() { document.getElementById("printOptBackdrop").classList.remove("open"); }

function doPrintRoster() {
  const opts = {
    dob: document.getElementById("poDob").checked,
    phone: document.getElementById("poPhone").checked,
    address: document.getElementById("poAddress").checked,
    gender: document.getElementById("poGender").checked,
    note: document.getElementById("poNote").checked
  };
  buildPrintArea(opts);
  closePrintOpt();
  setTimeout(() => window.print(), 100);
}

function printClassTable(cls, opts) {
  const cols = [{ label: "이름", key: "name" }];
  if (opts.dob) cols.push({ label: "생년월일", key: "dob" });
  if (opts.phone) cols.push({ label: "전화번호", key: "phone" });
  if (opts.address) cols.push({ label: "주소", key: "address" });
  if (opts.gender) cols.push({ label: "성별", key: "gender" });
  if (opts.note) cols.push({ label: "비고", key: "note" });
  const w = Math.floor(74 / Math.max(cols.length - 1, 1));
  const ths = cols.map((c, i) => `<th${i === 0 ? ' style="width:26%"' : ` style="width:${w}%"`}>${c.label}</th>`).join("");
  const rows = cls.members.map(m =>
    `<tr>${cols.map(c => `<td>${escapeHtml(m[c.key]) || "-"}</td>`).join("")}</tr>`
  ).join("");
  return `<div class="print-class-block"><h3>${escapeHtml(cls.name)} (${cls.members.length}명)</h3>
    <table class="print-table"><tr>${ths}</tr>${rows || `<tr><td colspan="${cols.length}" style="text-align:center;color:#666;">인원 없음</td></tr>`}</table></div>`;
}

function buildPrintArea(opts) {
  if (!opts) opts = { dob: true, phone: true, address: false, gender: false, note: false };
  const container = document.getElementById("printArea");
  let html = "";
  const ages = [...new Set(state.classes.filter(c => c.kind === "regular").map(c => c.age))];
  ages.forEach(age => {
    const classesOfAge = state.classes.filter(c => c.kind === "regular" && c.age === age);
    const total = classesOfAge.reduce((s, c) => s + c.members.length, 0);
    html += `<div class="print-page"><div class="print-header">
      <div class="p-title">${escapeHtml(state.title)} · ${escapeHtml(age)} (${total}명)</div>
      <div class="p-date">기준일: ${escapeHtml(state.updated)}</div></div>
      ${classesOfAge.map(c => printClassTable(c, opts)).join("")}</div>`;
  });
  const newCls = findClass("c_new");
  if (newCls && newCls.members.length) {
    html += `<div class="print-page"><div class="print-header">
      <div class="p-title">${escapeHtml(state.title)} · ${escapeHtml(newCls.name)} (${newCls.members.length}명)</div>
      <div class="p-date">기준일: ${escapeHtml(state.updated)}</div></div>
      ${printClassTable(newCls, opts)}</div>`;
  }
  container.innerHTML = html;
}

/* ===== 상세보기 / 추가 / 수정 / 삭제 / 이동 ===== */

function toggleDetail(mid) { const el = document.getElementById("detail-" + mid); if (el) el.classList.toggle("open"); }

function openAddModal(preferClassId) {
  if (!guardEditable()) return;
  editingMemberId = null;
  document.getElementById("modalTitle").textContent = "사람 추가";
  ["fName","fPhone","fAddress","fNote"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("fDob").value = "";
  document.getElementById("fGender").value = "";
  if (preferClassId) document.getElementById("fClass").value = preferClassId;
  document.getElementById("modalBackdrop").classList.add("open");
  document.getElementById("fName").focus();
}

function openEditModal(mid) {
  if (!guardEditable()) return;
  const loc = findMemberLocation(mid); if (!loc) return;
  editingMemberId = mid; const m = loc.cls.members[loc.idx];
  document.getElementById("modalTitle").textContent = "사람 정보 수정";
  document.getElementById("fClass").value = loc.cls.id;
  document.getElementById("fName").value = m.name || "";
  document.getElementById("fDob").value = dotDobToIso(m.dob);
  document.getElementById("fGender").value = m.gender || "";
  document.getElementById("fPhone").value = m.phone || "";
  document.getElementById("fAddress").value = m.address || "";
  document.getElementById("fNote").value = m.note || "";
  document.getElementById("modalBackdrop").classList.add("open");
  document.getElementById("fName").focus();
}

function closeModal() { document.getElementById("modalBackdrop").classList.remove("open"); editingMemberId = null; }

function saveModal() {
  if (!guardEditable()) return;
  const name = document.getElementById("fName").value.trim();
  if (!name) { alert("이름을 입력해주세요."); return; }
  const targetClassId = document.getElementById("fClass").value;
  const d = { name, dob: isoDobToDot(document.getElementById("fDob").value), gender: document.getElementById("fGender").value,
    phone: document.getElementById("fPhone").value.trim(), address: document.getElementById("fAddress").value.trim(),
    note: document.getElementById("fNote").value.trim() };

  if (editingMemberId) {
    const loc = findMemberLocation(editingMemberId); if (!loc) return;
    if (loc.cls.id !== targetClassId) {
      const [removed] = loc.cls.members.splice(loc.idx, 1);
      findClass(targetClassId).members.push({ ...removed, ...d });
    } else { loc.cls.members[loc.idx] = { ...loc.cls.members[loc.idx], ...d }; }
    toast(`${name} 님 정보를 저장했습니다.`);
  } else {
    const target = findClass(targetClassId);
    target.members.push({ id: genMemberId(), ...d });
    toast(`${name} 님을 ${target.name}에 추가했습니다.`);
  }
  saveState(); render(); closeModal();
}

function deleteMember(mid) {
  if (!guardEditable()) return;
  const loc = findMemberLocation(mid); if (!loc) return;
  const m = loc.cls.members[loc.idx];
  if (!confirm(`'${m.name}' 님을 명단에서 완전히 삭제할까요?`)) return;
  loc.cls.members.splice(loc.idx, 1); saveState(); render(); toast(`${m.name} 님을 삭제했습니다.`);
}

/* ===== [수정] 반 이동 모달 (별명부로 이동 / 별명부에서 복귀 / 다른 반으로 이동 공용)
   예전에는 숫자를 입력하는 prompt()나 곧바로 별명부로 보내버리는 confirm()으로 처리했지만,
   이제는 하나의 모달에서 드롭다운으로 이동할 반을 직접 선택합니다. */
let movingMemberId = null;

function classMoveLabel(c) {
  return c.kind === "regular" ? `${c.age} ${c.name}` : c.name;
}

function openMoveClassFlow(mid) {
  if (!guardEditable()) return;
  const loc = findMemberLocation(mid); if (!loc) return;
  movingMemberId = mid;
  const m = loc.cls.members[loc.idx];
  document.getElementById("moveClassMemberName").textContent = `'${m.name}' 님 (현재: ${classMoveLabel(loc.cls)})을(를) 이동할 반을 선택해주세요.`;
  const sel = document.getElementById("moveClassSelect");
  const options = state.classes.filter(c => c.id !== loc.cls.id);
  sel.innerHTML = options.map(c => `<option value="${c.id}">${escapeHtml(classMoveLabel(c))}</option>`).join("");
  document.getElementById("moveClassBackdrop").classList.add("open");
}

function closeMoveClassModal() {
  document.getElementById("moveClassBackdrop").classList.remove("open");
  movingMemberId = null;
}

function confirmMoveClassModal() {
  if (!guardEditable()) return;
  if (!movingMemberId) { closeMoveClassModal(); return; }
  const loc = findMemberLocation(movingMemberId);
  if (!loc) { closeMoveClassModal(); return; }
  const targetId = document.getElementById("moveClassSelect").value;
  const target = findClass(targetId);
  if (!target) { closeMoveClassModal(); return; }
  const m = loc.cls.members[loc.idx];
  loc.cls.members.splice(loc.idx, 1);
  if (target.kind === "alt") {
    target.members.push({ ...m, _fromClass: loc.cls.id });
  } else {
    const { _fromClass, ...clean } = m;
    target.members.push(clean);
  }
  saveState(); render();
  toast(`${m.name} 님을 ${classMoveLabel(target)}(으)로 이동했습니다.`);
  closeMoveClassModal();
}

/* ===== 반 추가 / 수정 / 삭제 ===== */

let editingClassId = null;

function openClassModal(classId) {
  if (!guardEditable()) return;
  populateAgeDatalist();
  if (classId) {
    const cls = findClass(classId);
    if (!cls || cls.kind !== "regular") return;
    editingClassId = classId;
    document.getElementById("classModalTitle").textContent = "반 정보 수정";
    document.getElementById("cAge").value = cls.age || "";
    document.getElementById("cName").value = cls.name || "";
    document.getElementById("cTeachers").value = (cls.teachers || []).join(", ");
  } else {
    editingClassId = null;
    document.getElementById("classModalTitle").textContent = "반 추가";
    ["cAge", "cName", "cTeachers"].forEach(id => document.getElementById(id).value = "");
  }
  document.getElementById("classModalBackdrop").classList.add("open");
  document.getElementById("cAge").focus();
}

function closeClassModal() { document.getElementById("classModalBackdrop").classList.remove("open"); editingClassId = null; }

function saveClassModal() {
  if (!guardEditable()) return;
  const age = document.getElementById("cAge").value.trim();
  const name = document.getElementById("cName").value.trim();
  const teachersRaw = document.getElementById("cTeachers").value.trim();
  if (!age) { alert("학년/연령을 입력해주세요. (예: 5세)"); return; }
  if (!name) { alert("반 이름을 입력해주세요."); return; }

  const dup = state.classes.some(c => c.kind === "regular" && c.age === age && c.name === name && c.id !== editingClassId);
  if (dup) { alert(`'${age} ${name}' 반은 이미 있습니다. 다른 이름을 입력해주세요.`); return; }

  const teachers = teachersRaw ? teachersRaw.split(",").map(s => s.trim()).filter(Boolean) : [];

  if (editingClassId) {
    const cls = findClass(editingClassId);
    if (!cls) { closeClassModal(); return; }
    cls.age = age; cls.name = name; cls.teachers = teachers;
    saveState(); render(); closeClassModal();
    toast(`'${age} ${name}' 반 정보를 수정했습니다.`);
  } else {
    state.classes.push({ id: genClassId(), kind: "regular", age, pastor: "", name, teachers, members: [] });
    saveState(); render(); closeClassModal();
    toast(`'${age} ${name}' 반을 추가했습니다.`);
  }
}

function deleteClass(classId) {
  if (!guardEditable()) return;
  const cls = findClass(classId);
  if (!cls || cls.kind !== "regular") return;
  const memberCount = cls.members.length;
  const msg = memberCount > 0
    ? `'${cls.age} ${cls.name}' 반을 삭제할까요?\n\n⚠ 이 반에 소속된 ${memberCount}명의 정보도 함께 삭제됩니다.`
    : `'${cls.age} ${cls.name}' 반을 삭제할까요?`;
  if (!confirm(msg)) return;
  state.classes = state.classes.filter(c => c.id !== classId);
  saveState(); render();
  toast(`'${cls.age} ${cls.name}' 반을 삭제했습니다.`);
}
