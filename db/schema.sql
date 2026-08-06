-- Supabase SQL Editor에서 이 파일 전체를 붙여넣고 실행하세요 (Run).
-- 앱의 모든 데이터(반별명단, 출석부)를 key/value(JSON) 형태로 저장하는 단순한 테이블입니다.
-- RLS(Row Level Security)를 켜두고 별도 정책(policy)을 추가하지 않았기 때문에,
-- anon/authenticated 키로는 이 테이블에 절대 직접 접근할 수 없습니다.
-- 오직 서버(Vercel 서버리스 함수)가 가진 service_role 키만 이 테이블을 읽고 쓸 수 있습니다.
-- => 아이들의 이름/생년월일/주소/전화번호가 브라우저에서 직접 노출되지 않습니다.

create table if not exists public.app_state (
  key text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by text
);

alter table public.app_state enable row level security;
-- 정책(policy)을 의도적으로 추가하지 않습니다. (anon/authenticated 접근 전면 차단)

-- 참고: 나중에 사람/반/출석을 각각 정규화된 테이블로 나누고 싶다면
-- 이 테이블은 그대로 두고 새 테이블을 추가한 뒤 점진적으로 옮겨가면 됩니다.
