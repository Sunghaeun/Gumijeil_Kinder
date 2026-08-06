// 최초 1회만 실행하는 마이그레이션 스크립트입니다.
// 원본 HTML 파일 안에 있던 초기 명단 데이터(seed-data.json)를 Supabase(app_state 테이블)에 넣습니다.
//
// 실행 전: .env 파일(또는 환경변수)에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 설정하세요.
// 실행:   node db/seed-import.js
//
// 이미 데이터가 있는 상태에서 다시 실행하면 roster 데이터를 seed 값으로 덮어씁니다.
// (배포 후 앱에서 이미 데이터를 수정했다면 다시 실행하지 마세요!)

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const seed = JSON.parse(fs.readFileSync(path.join(__dirname, "seed-data.json"), "utf-8"));

// public/js/data.js의 buildInitialState()와 동일한 로직 (Node 환경용으로 재작성)
function buildInitialState(seed) {
  let uid = 1;
  const nextId = () => "m" + (uid++);
  const classes = [];

  seed.ageGroups.forEach(group => {
    group.classes.forEach(c => {
      classes.push({
        id: "c" + classes.length, kind: "regular", age: group.age, pastor: group.pastor || "",
        name: c.name, teachers: c.teachers || [],
        members: c.members.map(mm => ({ id: nextId(), ...mm }))
      });
    });
  });
  classes.push({ id: "c_new", kind: "new", age: "", pastor: "", name: seed.newClass.name, teachers: [],
    members: seed.newClass.members.map(mm => ({ id: nextId(), ...mm })) });
  classes.push({ id: "c_alt", kind: "alt", age: "", pastor: "", name: seed.altList.name, teachers: [],
    members: seed.altList.members.map(mm => ({ id: nextId(), ...mm })) });

  const teachers = (seed.teachers || []).map((t, i) => ({
    id: "t" + (i + 1), name: t.name, dob: t.dob || "", calType: t.calType || "solar",
    gender: t.gender || "", phone: t.phone || "", note: t.note || ""
  }));
  return {
    title: seed.title, updated: seed.updated, footnote: seed.footnote, summary: seed.summary,
    ageOrder: seed.ageGroups.map(g => ({ age: g.age, pastor: g.pastor, label: g.label })),
    classes, teachers, teacherUidCounter: teachers.length + 1, uidCounter: uid
  };
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다. (.env 파일 확인)");
    process.exit(1);
  }
  const supabase = createClient(url, serviceKey);

  const rosterState = buildInitialState(seed);
  const attendanceState = { weeks: [], records: {}, teacherRecords: {}, calMonth: new Date().toISOString().slice(0, 7), dateNotes: {}, freeNotes: [] };

  const { error: e1 } = await supabase.from("app_state").upsert(
    { key: "roster", data: rosterState, updated_at: new Date().toISOString(), updated_by: "seed-import" },
    { onConflict: "key" }
  );
  if (e1) { console.error("roster 저장 실패:", e1.message); process.exit(1); }
  console.log("roster 데이터 저장 완료 (" + rosterState.classes.length + "개 반)");

  const { error: e2 } = await supabase.from("app_state").upsert(
    { key: "attendance", data: attendanceState, updated_at: new Date().toISOString(), updated_by: "seed-import" },
    { onConflict: "key" }
  );
  if (e2) { console.error("attendance 초기화 실패:", e2.message); process.exit(1); }
  console.log("attendance 데이터 초기화 완료");

  console.log("\n완료되었습니다. 이제 배포된 사이트에 로그인해서 확인해보세요.");
}

main();
