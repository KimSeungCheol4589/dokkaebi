# 도깨비 문파 홈페이지

도깨비의세계 문파용 팬 홈페이지입니다. 밤하늘과 도깨비불, 도트 그림으로 꾸민 랜딩 페이지에 아래 기능이 있습니다.

- **문파 소개**: 문파 이름, 레벨과 경험치, 공지, 전투력 순위, 이번 주 성장왕
- **문파원**: 닉네임, 직책, 전투력, 최근 7일 성장, 기여 포인트 (전투력/성장/포인트 순 정렬)
- **문파창고**: 기여·성장 포인트로 아이템 신청 → 운영진 승인 시 재고와 포인트 차감
- **내 정보**: 닉네임·전투력 갱신, 포인트 내역
- **관리** (문주·부문주): 신청 처리, 포인트 일괄 지급, 가입 승인, 직책 변경(문주만), 창고 아이템·재고, 문파 정보 수정

## 바로 써 보기 (체험 모드)

```bash
npm install
npm run dev
```

`.env` 가 없으면 **체험 모드**로 실행됩니다. 로그인 화면의 체험 계정 버튼(문주/부문주/문파원/가입 대기자)으로 모든 화면을 둘러볼 수 있고, 데이터는 그 브라우저에만 저장됩니다.

## 실제 운영 설정 (Supabase)

1. [supabase.com](https://supabase.com) 에서 무료 프로젝트를 만듭니다.
2. 대시보드 **SQL Editor** 에 [`supabase/schema.sql`](supabase/schema.sql) 내용을 전부 붙여 넣고 실행합니다.
3. **Project Settings → API** 의 `Project URL` 과 `anon public` 키를 `.env` 에 넣습니다.
   ```bash
   cp .env.example .env
   ```
4. **Authentication → URL Configuration** 의 Site URL 을 홈페이지 주소로 바꿉니다. (인증 메일 링크가 여기로 돌아옵니다.)
5. 문주가 **가장 먼저 가입**하세요. 첫 가입자는 자동으로 문주가 되고, 이후 가입자는 운영진이 승인해야 합니다.

> 이메일 인증이 번거로우면 Authentication → Providers → Email 에서 *Confirm email* 을 끌 수 있습니다.

## 권한 규칙

| | 비로그인 | 가입 대기 | 문파원 | 부문주 | 문주 |
|---|:-:|:-:|:-:|:-:|:-:|
| 문파 소개·문파원 목록 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 기여 포인트 보기 | | | ✅ | ✅ | ✅ |
| 창고 신청 | | | ✅ | ✅ | ✅ |
| 가입 승인·포인트 지급·창고 관리·신청 처리 | | | | ✅ | ✅ |
| 직책 변경 | | | | | ✅ |

규칙은 화면이 아니라 DB(RLS 정책과 RPC 함수)에서 검사하므로 화면을 우회해도 지켜집니다.

## 배포 (GitHub Pages)

1. 저장소 **Settings → Pages → Source** 를 *GitHub Actions* 로 바꿉니다.
2. **Settings → Secrets and variables → Actions** 에 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 를 등록합니다.
3. `main` 에 푸시하면 [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 이 빌드해서 배포합니다.

## 구조

```
src/
  pages/        화면 (Home, Members, Warehouse, MyPage, Admin, Login)
  components/   레이아웃, 밤하늘 장면, 도트 스프라이트
  lib/          types, supabaseBackend(실제 DB), demoBackend(체험 모드), auth
supabase/schema.sql   테이블, 권한(RLS), 창고 신청/승인 함수
```

## 참고

- 글꼴: [갈무리(Galmuri)](https://github.com/quiple/galmuri) — SIL OFL 1.1
- 도깨비의세계 공식 사이트가 아닌 팬 홈페이지입니다. 공식 로고·이미지는 쓰지 않았고, 도트 그림은 직접 그린 것입니다.
