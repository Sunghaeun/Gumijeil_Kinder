// 연도별 반별명단 기능을 미리 테스트해볼 수 있도록, 2022~2025년치 "가짜(더미)" 데이터를
// 만들어 넣는 스크립트입니다. 실제 원생 이름을 절대 사용하지 않고, 누가 봐도 테스트용임을
// 알 수 있는 이름("테스트아동1" 등)만 사용합니다.
//
// 이 스크립트는 다음을 함께 처리합니다:
//   1) 아직 연도별 구조로 전환되지 않았다면(=roster_meta가 없다면), 기존 "roster" 키의
//      실제 데이터를 올해(currentYear) 데이터로 옮깁니다 (js/data.js의 loadMeta()와 동일한
//      마이그레이션을 서버에서 미리 한 번 해두는 것뿐이라, 이미 되어 있어도 안전합니다).
//   2) 2022~2025년 더미 데이터를 roster_2022 ~ roster_2025 키에 저장합니다.
//   3) roster_meta에 { currentYear, years: [2022,2023,2024,2025,<올해>] }를 반영합니다.
//
// 실행 전: .env 파일에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 설정
// 실행:   node db/seed-dummy-years.js

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const DUMMY_YEARS = [2022, 2023, 2024, 2025];

function buildInitialStateFromSeed(seed) {
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
  classes.push({ id: "c_new", kind: "new", age: "", pastor: "", name: seed.newClass.name,
    members: seed.newClass.members.map(mm => ({ id: nextId(), ...mm })) });
  classes.push({ id: "c_alt", kind: "alt", age: "", pastor: "", name: seed.altList.name,
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

/* 연도별로 티가 나도록, 반/인원 수를 조금씩 다르게 만든 더미 데이터를 생성합니다.
   모든 이름은 "테스트아동", "테스트교사"처럼 누가 봐도 가짜임을 알 수 있게 지었습니다. */
function buildDummyYearState(year) {
  let uid = 1;
  const nextId = () => "m" + (uid++);
  const classCountsByAge = { "5세": 2, "6세": 2, "7세": 1 }; // 연도마다 반 개수는 같게, 인원만 다르게
  const membersPerClass = 2 + (year % 3); // 2~4명, 연도마다 조금씩 다르게

  let personCounter = 1;
  const classes = [];
  Object.entries(classCountsByAge).forEach(([age, classCount]) => {
    for (let i = 1; i <= classCount; i++) {
      const members = [];
      for (let j = 0; j < membersPerClass; j++) {
        members.push({
          id: nextId(),
          name: `테스트아동${personCounter++}`,
          dob: `${String(year - parseInt(age, 10)).slice(-2)}.01.01`,
          gender: j % 2 === 0 ? "남" : "여",
          phone: "010-0000-0000",
          address: "(테스트 주소)",
          note: "더미 데이터"
        });
      }
      classes.push({
        id: `c_${year}_${age}_${i}`, kind: "regular", age, pastor: "",
        name: `테스트${i}반`, teachers: [`테스트교사${i}`],
        members
      });
    }
  });
  classes.push({
    id: "c_new", kind: "new", age: "", pastor: "", name: "신입반",
    members: [{ id: nextId(), name: `테스트신입아동`, dob: "", gender: "", phone: "", address: "", note: "더미 데이터" }]
  });
  classes.push({
    id: "c_alt", kind: "alt", age: "", pastor: "", name: "별명부",
    members: []
  });

  const teacherNames = [...new Set(classes.filter(c => c.kind === "regular").flatMap(c => c.teachers))];
  const teachers = teacherNames.map((name, i) => ({
    id: "t" + (i + 1), name, dob: "", calType: "solar", gender: "", phone: "", note: "더미 데이터"
  }));

  const regularTotal = classes.filter(c => c.kind === "regular").reduce((s, c) => s + c.members.length, 0);
  return {
    title: "구미제일교회 유치부 반별명단 (테스트용 더미 데이터)",
    updated: `${year}.12.31`,
    footnote: `⚠ 이 ${year}년 데이터는 연도별 자료 기능을 테스트하기 위한 더미(가짜) 데이터입니다. 실제 원생 정보가 아닙니다.`,
    summary: `총${regularTotal}명(테스트용)`,
    ageOrder: Object.keys(classCountsByAge).map(age => ({ age, pastor: "", label: "" })),
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
  const currentYear = new Date().getFullYear();

  async function upsertState(key, data) {
    const { error } = await supabase.from("app_state").upsert(
      { key, data, updated_at: new Date().toISOString(), updated_by: "seed-dummy-years" },
      { onConflict: "key" }
    );
    if (error) { console.error(`${key} 저장 실패:`, error.message); process.exit(1); }
  }

  // 1) 아직 연도별 구조로 전환 안 됐으면(roster_meta 없음), 올해 데이터를 만들어둡니다.
  const { data: metaRow } = await supabase.from("app_state").select("data").eq("key", "roster_meta").maybeSingle();
  let metaState = metaRow ? metaRow.data : null;

  const { data: currentYearRow } = await supabase.from("app_state").select("data").eq("key", `roster_${currentYear}`).maybeSingle();
  if (!currentYearRow) {
    const { data: legacyRow } = await supabase.from("app_state").select("data").eq("key", "roster").maybeSingle();
    let currentYearState;
    if (legacyRow && legacyRow.data) {
      currentYearState = legacyRow.data;
      console.log(`기존 "roster" 데이터를 ${currentYear}년 데이터로 옮깁니다.`);
    } else {
      const seedPath = path.join(__dirname, "seed-data.json");
      const seed = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
      currentYearState = buildInitialStateFromSeed(seed);
      console.log(`기존 데이터가 없어 seed-data.json 기준으로 ${currentYear}년 데이터를 만듭니다.`);
    }
    await upsertState(`roster_${currentYear}`, currentYearState);
    console.log(`roster_${currentYear} 저장 완료`);
  } else {
    console.log(`roster_${currentYear}는 이미 있어서 건드리지 않습니다.`);
  }

  // 2) 2022~2025년 더미 데이터
  for (const year of DUMMY_YEARS) {
    const dummy = buildDummyYearState(year);
    await upsertState(`roster_${year}`, dummy);
    console.log(`roster_${year} 더미 데이터 저장 완료 (테스트용, 실제 원생 아님)`);
  }

  // 3) roster_meta 갱신
  const years = [...new Set([...DUMMY_YEARS, currentYear, ...(metaState ? metaState.years : [])])].sort((a, b) => a - b);
  metaState = { currentYear, years };
  await upsertState("roster_meta", metaState);
  console.log("\nroster_meta:", JSON.stringify(metaState));
  console.log("\n완료되었습니다. 배포된 사이트에서 상단 연도 드롭다운으로 2022~2025년(더미)과 " + currentYear + "년(실제)을 확인해보세요.");
}

main();
