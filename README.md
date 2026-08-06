# 구미제일교회 유치부 반별명단 - 배포 가이드

원래 하나의 HTML 파일(인라인 CSS/JS + `localStorage`)이었던 앱을 아래처럼 재구성했습니다.

```
gmch-app/
├─ index.html          # 메인 화면 (로그인 필요)
├─ login.html           # 로그인 화면
├─ robots.txt            # 검색엔진 색인 방지
├─ css/style.css         # 원본 <style> 내용 그대로
├─ js/
│  ├─ api.js             # 서버(API) 통신 + 로그인 세션 관리
│  ├─ data.js             # 초기 시드 데이터 + 반별명단 상태 관리
│  ├─ roster.js            # 반별명단 화면/등록/수정/삭제/인쇄
│  ├─ teachers.js           # 선생님 명단
│  ├─ search.js              # 이름 검색
│  ├─ attendance.js           # 출석부 (주차/체크/합계/인쇄)
│  ├─ calendar.js              # 캘린더/생일/메모
│  ├─ tabs.js                   # 탭 전환
│  └─ main.js                    # 시작점(로그인 확인 → 데이터 로드 → 렌더링)
├─ api/
│  ├─ login.js            # POST 로그인 (Supabase Auth)
│  └─ state.js              # GET/PUT 반별명단·출석부 데이터
├─ lib/
│  ├─ supabaseAdmin.js     # 서버 전용 Supabase 클라이언트
│  └─ verifyAuth.js          # 로그인 토큰 검증
├─ db/
│  ├─ schema.sql            # DB 테이블 생성 SQL
│  ├─ seed-data.json          # 원본 초기 데이터 (마이그레이션용)
│  └─ seed-import.js            # 초기 데이터를 DB에 넣는 1회용 스크립트
├─ package.json
└─ .env.example
```

## ⚠️ 먼저 꼭 읽어주세요 (개인정보 보호)

이 앱에는 원아 이름, 생년월일, 성별, 전화번호, 집 주소, 부모님 이름이 들어 있습니다.
**미성년자(아동)의 개인정보**이기 때문에 아래 원칙을 지키도록 구성했습니다.

- 로그인해야만 명단을 볼 수 있습니다 (`login.html` → Supabase Auth).
- 실제 DB(`app_state` 테이블)는 RLS(Row Level Security)로 잠겨 있어서, 브라우저가 갖고 있는
  `anon` 키로는 절대 직접 접근할 수 없습니다. 오직 서버(Vercel 함수)만 접근 가능한
  `service_role` 키로만 데이터를 읽고 씁니다.
- `robots.txt`와 `noindex` 메타 태그로 검색엔진 색인을 막아뒀습니다.
- 로그인 계정은 **회원가입 기능이 없고**, 관리자(선생님)가 Supabase 대시보드에서 직접
  추가하는 방식입니다. 아무나 계정을 만들 수 없습니다.

계정(이메일/비밀번호)은 실제로 접근해야 하는 선생님/사역자에게만 나눠주세요.

---

## 1단계. Supabase 프로젝트 만들기

1. https://supabase.com 에서 무료 계정으로 로그인하고 **New Project**를 클릭합니다.
2. 프로젝트 이름과 DB 비밀번호를 설정하고 리전은 **Northeast Asia (Seoul)**를 선택합니다.
3. 프로젝트가 만들어지면 왼쪽 메뉴 **SQL Editor**를 열고, 이 프로젝트의 `db/schema.sql`
   파일 내용을 전체 복사해서 붙여넣은 뒤 **Run**을 클릭합니다. (`app_state` 테이블이 생성됩니다.)
4. 왼쪽 메뉴 **Project Settings → API**로 이동해서 아래 3가지 값을 복사해둡니다.
   - `Project URL` → `SUPABASE_URL`
   - `anon public` 키 → `SUPABASE_ANON_KEY`
   - `service_role` 키 → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 이건 절대 남에게 공유하거나
     GitHub에 올리면 안 됩니다)

## 2단계. 로그인할 선생님 계정 만들기

1. Supabase 대시보드 왼쪽 메뉴 **Authentication → Users**로 이동합니다.
2. **Add user → Create new user**를 클릭하고, 이메일/비밀번호를 입력한 뒤
   **Auto Confirm User**를 체크하고 저장합니다.
3. 로그인할 선생님 수만큼 반복합니다. (이 계정 정보로 `login.html`에서 로그인합니다.)

## 3단계. 초기 데이터 넣기 (원본 명단을 DB로 옮기기)

로컬 컴퓨터(또는 이 작업 환경)에서 한 번만 실행하면 됩니다.

```bash
cd gmch-app
npm install
cp .env.example .env
# .env 파일을 열어 1단계에서 복사해둔 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 채워넣기
npm run seed
```

"roster 데이터 저장 완료", "attendance 데이터 초기화 완료"가 출력되면 성공입니다.
Supabase 대시보드 **Table Editor → app_state**에서 `roster` / `attendance` 두 개의 행이
생긴 것을 확인할 수 있습니다.

## 4단계. GitHub에 올리기

```bash
cd gmch-app
git init
git add .
git commit -m "구미제일교회 유치부 반별명단 - 초기 커밋"
```

GitHub에서 새 저장소(Repository)를 만들고(Private 추천 — 개인정보가 포함된 프로젝트이므로),
안내되는 명령어로 push 합니다.

```bash
git remote add origin <새로 만든 저장소 주소>
git branch -M main
git push -u origin main
```

## 5단계. Vercel 배포

1. https://vercel.com 에서 GitHub 계정으로 로그인합니다.
2. **Add New → Project**를 클릭하고 방금 올린 GitHub 저장소를 선택(Import)합니다.
3. **Environment Variables**에 아래 3개를 추가합니다. (Framework Preset은 "Other"로 두면 됩니다)
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. **Deploy**를 클릭합니다. 1~2분 뒤 배포가 완료되고 `https://프로젝트이름.vercel.app` 같은
   주소가 발급됩니다.

## 6단계. 접속 확인

1. 발급받은 주소로 접속하면 로그인 화면이 먼저 나옵니다.
2. 2단계에서 만든 이메일/비밀번호로 로그인합니다.
3. 반별명단, 선생님 명단, 출석부가 원본과 동일하게 나오는지 확인합니다.
4. 사람 추가/수정/삭제, 출석 체크가 잘 저장되는지, 새로고침해도 유지되는지 확인합니다.
5. 다른 기기(휴대폰 등)에서 접속해도 같은 데이터가 보이는지 확인합니다. (이게 바로
   `localStorage` 대신 진짜 DB를 쓰는 이유입니다 — 이제 여러 사람이 같은 데이터를 봅니다.)

## 문제가 생기면

- **로그인이 안 돼요**: Supabase Authentication → Users에서 계정이 정말 있는지,
  "Auto Confirm User"가 체크되어 있었는지 확인하세요.
- **로그인은 되는데 명단이 안 보여요**: Vercel 프로젝트의 환경변수 3개가 정확히
  들어갔는지 확인하고, 다시 배포(Redeploy)해보세요.
- **저장이 안 돼요 / "저장 실패" 토스트가 떠요**: 브라우저 개발자도구(F12) → Network
  탭에서 `/api/state` 요청이 어떤 에러를 반환하는지 확인해보세요. 보통 환경변수 문제입니다.

## 다음 단계로 더 개선하고 싶다면

지금은 반별명단/출석부 데이터를 각각 JSON 덩어리(`app_state` 테이블 한 줄)로 저장합니다.
동작은 원본과 100% 동일하고 안전하지만, "사람" "반" "출석기록"을 각각 별도 테이블로
정규화(normalize)하면 나중에 통계·검색·권한 분리가 더 쉬워집니다. 필요하시면 이어서
`members`, `classes`, `attendance_records` 같은 테이블로 나누는 2단계 마이그레이션도
도와드릴 수 있습니다.
