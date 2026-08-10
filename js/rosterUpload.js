/* 매년 새로 받는 한글(HWP) 반별명단 파일을 업로드해서 그 해의 데이터를 자동으로 만들거나
   업데이트하는 기능입니다. 흐름: 파일 선택 → 서버(파이썬)에서 표 분석 → 기존 자료와 비교한
   미리보기를 보여줌 → 사용자가 "반영하기"를 눌러야만 실제로 저장됩니다.
   (명단에서 빠진 사람은 절대 자동으로 지우지 않고, "새 파일에 없음"으로만 표시합니다.) */

let rosterUploadParsedResult = null; // 방금 업로드해서 분석한 원본 결과 (parse-roster-hwp.py 응답)
let rosterUploadTargetYear = null;   // 미리보기에서 사용자가 확정한 "적용할 연도"
let rosterUploadBaseState = null;    // 비교 대상: 그 연도에 이미 저장된 state (새 연도면 null)
let rosterUploadIsNewYear = false;

async function handleRosterFileSelected(e) {
  const file = e.target.files && e.target.files[0];
  e.target.value = ""; // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".hwp")) { alert("HWP(.hwp) 파일만 업로드할 수 있습니다."); return; }

  toast("한글 파일을 분석하는 중입니다... (몇 초 걸릴 수 있어요)");
  const session = getSession();
  const formData = new FormData();
  formData.append("file", file);

  let result;
  try {
    const res = await fetch("/api/parse-roster-hwp", {
      method: "POST",
      headers: { "Authorization": "Bearer " + (session ? session.access_token : "") },
      body: formData
    });
    if (res.status === 401) { clearSession(); location.href = "login.html"; return; }
    const body = await res.json();
    if (!res.ok) { alert("파일을 분석하지 못했습니다: " + (body.error || "알 수 없는 오류")); return; }
    result = body;
  } catch (err) {
    console.error(err);
    alert("파일을 업로드하지 못했습니다. 인터넷 연결을 확인해주세요.");
    return;
  }

  rosterUploadParsedResult = result;
  const guessYear = result.detectedYear || metaState.currentYear;
  document.getElementById("rosterUploadYearInput").value = guessYear;
  await openRosterUploadPreview(guessYear);
}

/* year를 기존에 등록된 연도(roster_meta.years)와 비교해서, 있으면 그 연도의 저장된 자료를
   불러와 비교 기준으로 삼고, 없으면 "새 연도"로 취급합니다. */
async function openRosterUploadPreview(year) {
  rosterUploadTargetYear = year;
  rosterUploadIsNewYear = !metaState.years.includes(year);
  if (rosterUploadIsNewYear) {
    rosterUploadBaseState = null;
  } else if (year === viewYear && state) {
    rosterUploadBaseState = state;
  } else {
    rosterUploadBaseState = await loadState(year);
  }
  renderRosterUploadPreview();
  document.getElementById("rosterUploadPreviewBackdrop").classList.add("open");
}

/* 미리보기 모달의 연도 입력값을 사용자가 직접 바꿨을 때 다시 비교합니다. */
async function refreshRosterUploadDiff() {
  if (!rosterUploadParsedResult) return;
  const year = parseInt(document.getElementById("rosterUploadYearInput").value, 10);
  if (isNaN(year) || year < 2000 || year > 2100) return;
  await openRosterUploadPreview(year);
}

function closeRosterUploadPreview() {
  document.getElementById("rosterUploadPreviewBackdrop").classList.remove("open");
  rosterUploadParsedResult = null;
  rosterUploadBaseState = null;
}

/* ===== 미리보기(비교) 렌더링 ===== */

function flattenStateMembers(st) {
  const map = new Map();
  st.classes.filter(c => c.kind === "regular").forEach(c => {
    c.members.forEach(m => map.set(m.name, { member: m, age: c.age, className: c.name, classId: c.id }));
  });
  return map;
}

function computeRosterDiff(parsed, baseState) {
  const diff = { newMembers: [], changedMembers: [], missingMembers: [], newClasses: [], newTeachers: [] };
  const existingByName = baseState ? flattenStateMembers(baseState) : new Map();
  const seenNames = new Set();
  const existingClassKey = new Set();
  if (baseState) {
    baseState.classes.filter(c => c.kind === "regular").forEach(c => existingClassKey.add(c.age + "|" + c.name));
  }
  const parsedTeacherNames = new Set();

  parsed.ageGroups.forEach(ag => {
    ag.classes.forEach(c => {
      const classKey = ag.age + "|" + c.name;
      if (!existingClassKey.has(classKey)) {
        diff.newClasses.push({ age: ag.age, name: c.name, teachers: c.teachers || [], memberCount: c.members.length });
      }
      (c.teachers || []).forEach(t => parsedTeacherNames.add(t));
      c.members.forEach(m => {
        seenNames.add(m.name);
        const existing = existingByName.get(m.name);
        if (!existing) {
          diff.newMembers.push({ name: m.name, age: ag.age, className: c.name });
        } else {
          const changes = [];
          ["dob", "gender", "phone", "address", "note"].forEach(k => {
            if ((existing.member[k] || "") !== (m[k] || "")) changes.push({ field: k, from: existing.member[k] || "", to: m[k] || "" });
          });
          if (existing.age !== ag.age || existing.className !== c.name) {
            changes.push({ field: "class", from: `${existing.age} ${existing.className}`, to: `${ag.age} ${c.name}` });
          }
          if (changes.length) diff.changedMembers.push({ name: m.name, changes });
        }
      });
    });
  });

  // 신입반/별명부는 별도 섹션이라 "변경 사항"까지는 비교하지 않고, 새로 나타난 이름인지만 확인합니다.
  (parsed.newClass ? parsed.newClass.members : []).forEach(m => {
    seenNames.add(m.name);
    if (!existingByName.has(m.name)) diff.newMembers.push({ name: m.name, age: "", className: "신입반" });
  });
  (parsed.altList ? parsed.altList.members : []).forEach(m => {
    seenNames.add(m.name);
    if (!existingByName.has(m.name)) diff.newMembers.push({ name: m.name, age: "", className: "별명부" });
  });

  if (baseState) {
    existingByName.forEach((info, name) => {
      if (!seenNames.has(name)) diff.missingMembers.push({ name, age: info.age, className: info.className });
    });
    baseState.classes.filter(c => c.kind === "new" || c.kind === "alt").forEach(c => {
      c.members.forEach(m => {
        if (!seenNames.has(m.name)) diff.missingMembers.push({ name: m.name, age: "", className: c.name });
      });
    });
    const existingTeacherNames = new Set((baseState.teachers || []).map(t => t.name));
    parsedTeacherNames.forEach(name => { if (!existingTeacherNames.has(name)) diff.newTeachers.push(name); });
  } else {
    parsedTeacherNames.forEach(name => diff.newTeachers.push(name));
  }

  return diff;
}

function fieldLabel(f) {
  return { dob: "생년월일", gender: "성별", phone: "전화번호", address: "주소", note: "비고", class: "반" }[f] || f;
}

function summarySection(title, items, warn) {
  if (!items.length) return "";
  const color = warn ? "var(--danger)" : "var(--navy)";
  return `<div style="margin-bottom:12px;">
    <div style="font-weight:700;color:${color};margin-bottom:4px;">${title} (${items.length})</div>
    <ul style="margin:0;padding-left:18px;font-size:12.5px;line-height:1.6;">${items.map(i => `<li>${i}</li>`).join("")}</ul>
  </div>`;
}

function renderRosterUploadPreview() {
  const parsed = rosterUploadParsedResult;
  const diff = computeRosterDiff(parsed, rosterUploadBaseState);
  const body = document.getElementById("rosterUploadPreviewBody");
  if (!body) return;

  let html = "";
  if (rosterUploadIsNewYear) {
    html += `<p style="color:var(--navy);font-weight:700;margin:0 0 8px;">🆕 ${rosterUploadTargetYear}년은 아직 없는 새로운 연도입니다. 이 연도의 반별명단을 새로 만듭니다.</p>`;
  } else {
    html += `<p style="color:var(--muted);font-size:12.5px;margin:0 0 8px;">이미 저장되어 있는 ${rosterUploadTargetYear}년 자료와 비교한 결과입니다.</p>`;
  }
  if (parsed.detectedYear) {
    html += `<p style="font-size:12.5px;color:var(--muted);margin:0 0 10px;">문서에서 인식한 연도: ${parsed.detectedYear}년${parsed.sourceTitle ? " · " + escapeHtml(parsed.sourceTitle) : ""} (다르면 위 연도 입력칸에서 직접 바꿔주세요)</p>`;
  }

  const ageClassLabel = m => [m.age, m.className].filter(Boolean).join(" ");
  html += summarySection("🆕 새로 추가되는 사람",
    diff.newMembers.map(m => `${escapeHtml(m.name)} (${escapeHtml(ageClassLabel(m))})`));
  html += summarySection("✏️ 정보가 바뀐 사람",
    diff.changedMembers.map(m => `${escapeHtml(m.name)}: ` + m.changes.map(c => `${fieldLabel(c.field)} "${escapeHtml(c.from) || "-"}" → "${escapeHtml(c.to) || "-"}"`).join(", ")));
  html += summarySection("⚠ 새 파일에는 없는 사람 (자동으로 지우지 않습니다 - 직접 확인해주세요)",
    diff.missingMembers.map(m => `${escapeHtml(m.name)} (${escapeHtml(ageClassLabel(m))})`), true);
  html += summarySection("📚 새로 생기는 반",
    diff.newClasses.map(c => `${escapeHtml(c.age)} ${escapeHtml(c.name)} (${c.memberCount}명, 담당: ${escapeHtml((c.teachers || []).join(", ")) || "-"})`));
  html += summarySection("🧑‍🏫 새로 추가되는 선생님", diff.newTeachers.map(n => escapeHtml(n)));

  if (!diff.newMembers.length && !diff.changedMembers.length && !diff.missingMembers.length && !diff.newClasses.length && !diff.newTeachers.length) {
    html += `<p style="color:var(--muted);">기존 자료와 달라진 내용이 없습니다.</p>`;
  }

  body.innerHTML = html;
}

/* ===== 실제 저장할 state 만들기 ===== */

function formatUploadDate() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

function blankMember(mm, nextId) {
  return { id: nextId(), name: mm.name, dob: mm.dob || "", gender: mm.gender || "", phone: mm.phone || "", address: mm.address || "", note: mm.note || "" };
}

/* 완전히 새로운 연도의 state를 파싱 결과로부터 처음부터 만듭니다.
   teacherLookupState: 있으면 여기서 선생님 이름이 겹칠 때 생년월일/전화번호 등 기존 정보를 이어받습니다. */
function buildStateFromParsedForYear(parsed, year, teacherLookupState) {
  let uid = 1;
  const nextId = () => "m" + (uid++);
  const classes = [];

  parsed.ageGroups.forEach(ag => {
    ag.classes.forEach(c => {
      classes.push({
        id: "c" + classes.length, kind: "regular", age: ag.age, pastor: ag.pastor || "",
        name: c.name, teachers: c.teachers || [],
        members: c.members.map(mm => blankMember(mm, nextId))
      });
    });
  });
  classes.push({ id: "c_new", kind: "new", age: "", pastor: "", name: "신입반",
    members: (parsed.newClass ? parsed.newClass.members : []).map(mm => blankMember(mm, nextId)) });
  classes.push({ id: "c_alt", kind: "alt", age: "", pastor: "", name: "별명부",
    members: (parsed.altList ? parsed.altList.members : []).map(mm => blankMember(mm, nextId)) });

  const teacherNames = new Set();
  parsed.ageGroups.forEach(ag => ag.classes.forEach(c => (c.teachers || []).forEach(t => teacherNames.add(t))));

  const lookupSource = (teacherLookupState && teacherLookupState.teachers) || [];
  let tuid = 1;
  const teachers = [...teacherNames].map(name => {
    const existing = lookupSource.find(t => t.name === name);
    if (existing) return { ...existing, id: "t" + (tuid++) };
    return { id: "t" + (tuid++), name, dob: "", calType: "solar", gender: "", phone: "", note: "" };
  });

  const regularTotal = classes.filter(c => c.kind === "regular").reduce((s, c) => s + c.members.length, 0);
  const altTotal = (parsed.altList ? parsed.altList.members.length : 0);

  return {
    title: (teacherLookupState && teacherLookupState.title) || SEED_DATA.title,
    updated: formatUploadDate(),
    footnote: (teacherLookupState && teacherLookupState.footnote) || SEED_DATA.footnote,
    summary: `총${regularTotal + altTotal}명(재적${regularTotal}+별명부${altTotal})`,
    ageOrder: parsed.ageGroups.map(g => ({ age: g.age, pastor: g.pastor, label: `${g.classes.reduce((s, c) => s + c.members.length, 0)}명` })),
    classes, teachers, teacherUidCounter: teachers.length + 1, uidCounter: uid
  };
}

/* 이미 있는 연도의 state에 파싱 결과를 병합합니다(제자리에서 변형/mutate).
   - 이름이 같으면 그 사람의 정보를 갱신(및 반이 바뀌었으면 이동)합니다.
   - 새 이름이면 추가합니다.
   - 새 파일에 없는 기존 사람은 그대로 둡니다(자동 삭제하지 않음).
   - 새 반/새 선생님은 추가합니다. */
function applyDiffToState(baseState, parsed) {
  const existingByName = flattenStateMembers(baseState);

  parsed.ageGroups.forEach(ag => {
    ag.classes.forEach(c => {
      let targetClass = baseState.classes.find(x => x.kind === "regular" && x.age === ag.age && x.name === c.name);
      if (!targetClass) {
        targetClass = { id: "c" + Date.now() + Math.floor(Math.random() * 10000), kind: "regular", age: ag.age, pastor: ag.pastor || "", name: c.name, teachers: c.teachers || [], members: [] };
        baseState.classes.push(targetClass);
      } else if (c.teachers && c.teachers.length) {
        targetClass.teachers = c.teachers;
      }

      c.members.forEach(m => {
        const existing = existingByName.get(m.name);
        if (existing) {
          Object.assign(existing.member, { dob: m.dob || "", gender: m.gender || "", phone: m.phone || "", address: m.address || "", note: m.note || "" });
          if (existing.classId !== targetClass.id) {
            const oldCls = baseState.classes.find(x => x.id === existing.classId);
            if (oldCls) oldCls.members = oldCls.members.filter(x => x.id !== existing.member.id);
            targetClass.members.push(existing.member);
            existing.classId = targetClass.id;
          }
        } else {
          const newMember = { id: "m" + (baseState.uidCounter++), name: m.name, dob: m.dob || "", gender: m.gender || "", phone: m.phone || "", address: m.address || "", note: m.note || "" };
          targetClass.members.push(newMember);
          existingByName.set(m.name, { member: newMember, age: ag.age, className: c.name, classId: targetClass.id });
        }
      });
    });
  });

  [["newClass", "new"], ["altList", "alt"]].forEach(([key, kind]) => {
    const cls = baseState.classes.find(c => c.kind === kind);
    const srcMembers = parsed[key] ? parsed[key].members : [];
    if (!cls) return;
    srcMembers.forEach(m => {
      const existing = cls.members.find(x => x.name === m.name);
      if (existing) Object.assign(existing, { dob: m.dob || "", gender: m.gender || "", phone: m.phone || "", address: m.address || "", note: m.note || "" });
      else cls.members.push({ id: "m" + (baseState.uidCounter++), name: m.name, dob: m.dob || "", gender: m.gender || "", phone: m.phone || "", address: m.address || "", note: m.note || "" });
    });
  });

  const teacherNames = new Set();
  parsed.ageGroups.forEach(ag => ag.classes.forEach(c => (c.teachers || []).forEach(t => teacherNames.add(t))));
  teacherNames.forEach(name => {
    if (!baseState.teachers.some(t => t.name === name)) {
      baseState.teachers.push({ id: "t" + (baseState.teacherUidCounter++), name, dob: "", calType: "solar", gender: "", phone: "", note: "" });
    }
  });

  baseState.updated = formatUploadDate();
  const regularTotal = baseState.classes.filter(c => c.kind === "regular").reduce((s, c) => s + c.members.length, 0);
  const altTotal = (baseState.classes.find(c => c.kind === "alt") || { members: [] }).members.length;
  baseState.summary = `총${regularTotal + altTotal}명(재적${regularTotal}+별명부${altTotal})`;
  return baseState;
}

/* ===== "반영하기" 확정 ===== */

async function applyRosterUpload() {
  if (!rosterUploadParsedResult) return;
  const year = parseInt(document.getElementById("rosterUploadYearInput").value, 10);
  if (isNaN(year) || year < 2000 || year > 2100) { alert("올바른 연도를 입력해주세요."); return; }

  const btn = document.getElementById("btnApplyRosterUpload");
  const originalLabel = btn.textContent;
  btn.disabled = true; btn.textContent = "저장 중...";

  try {
    let finalState;
    let makeCurrent;
    if (rosterUploadIsNewYear) {
      const teacherLookupState = (viewYear === metaState.currentYear && state) ? state : await loadState(metaState.currentYear);
      finalState = buildStateFromParsedForYear(rosterUploadParsedResult, year, teacherLookupState);
      makeCurrent = year >= metaState.currentYear;
    } else {
      finalState = JSON.parse(JSON.stringify(rosterUploadBaseState));
      applyDiffToState(finalState, rosterUploadParsedResult);
      makeCurrent = (year === metaState.currentYear);
    }

    await saveYearData(year, finalState, makeCurrent);
    toast(`${year}년 반별명단을 반영했습니다.`);
    closeRosterUploadPreview();

    viewYear = year;
    state = await loadState(year);
    render();
  } catch (e) {
    console.error(e);
    alert("저장 중 오류가 발생했습니다: " + e.message);
  } finally {
    btn.disabled = false; btn.textContent = originalLabel;
  }
}
