<!-- Beaver 규약 템플릿. /beaver:analyze 가 코드 분석으로 채운다.
     규칙:
       · 분석 근거 필수(추측 금지). 실측이면 근거 경로, 표준 채택이면 `(표준: <프레임워크> 권장)` 표기.
       · 용례 0건 공통 자산(util·베이스 클래스·데코레이터)은 정의 파일 시그니처만 사실대로 적고 "미적용/규약" 표기. 호출 예시를 상상해 만들지 말 것(인자 순서·이름 날조 금지).
       · 구현됐으나 적용 0건인 인프라는 "미적용/규약"으로. 적용된 것처럼 서술 금지.
       · 안 쓰는 섹션은 통째로 삭제(빈 헤더만 남기지 말 것).
       · 각 섹션 주석의 "담을 것 / 깊이"를 기준으로 채운다. 규칙 1~2줄로 끝나면 CLAUDE.md 본문에,
         예시 코드·표·단계 절차가 필요한 깊은 규칙은 docs/<topic>.md 로 분리하고 본문엔 `→ 상세:` 링크만.
       · "## Beaver 설정" 블록은 문구 그대로 유지(Beaver 동작에 필수).
     완성도 기준: 각 항목이 "이 규칙만 보고 새 도메인 1개를 규약대로 만들 수 있는가?" 를 통과해야 한다. -->

# CLAUDE.md

## Beaver 설정

이 프로젝트는 [Beaver](https://github.com/HaSungJe/beaver)로 관리된다. 각 단계는 슬래시/자연어로 발동(동일 동작):

| 단계 | 슬래시 | 자연어 |
|---|---|---|
| 분석(1회) | `/beaver:analyze` | "코드베이스 분석" |
| 기획 | `/beaver:plan <기능명>` | "<기능명> 기획", "기능 생성/수정" |
| 구현 | `/beaver:build` | "작업 시작", "구현" |
| 배포 | `/beaver:ship` | "커밋하고 푸쉬", "dam 병합" |
| 충돌 해결 | `/beaver:resolve` | "충돌 해결" (ship 병합 충돌 시 자동) |
| 방류 | `/beaver:release` | "dam 방류", "메인에 반영" |
| 리팩토링 | `/beaver:refactor` | "비슷한 기능 묶기", "중복 정리" |

**흐름**: 선택 소스 브랜치에서 복제한 `dam`(로컬 전용)에서 `stick`을 뻗어 `plan`→`build`(기획→구현)를 누적(build는 커밋 안 함) → `ship`이 커밋·코드리뷰·`dam` 로컬 병합(충돌 시 resolve 자동) → `release`가 dam을 소스 브랜치로 병합·푸쉬하고 로컬 dam 삭제. **stick·dam 모두 로컬 전용** — 원격엔 소스 브랜치(예: main)만 발행하며 release에서만 push한다.
**위치**: 설정 `.beaver/config.json` · 산출물 `.beaver/output/{spec,plan,revision,report,review,refactor}/` (spec/plan/revision/report는 `<domain>/` 하위, review는 stick 단위 flat, refactor는 주제 단위 flat) · 메모리 `.beaver/memory/`(인덱스 MEMORY.md, 코드로 알 수 있는 내용은 저장 안 함).
**우선순위**: `.beaver/memory/` 의 사용자 규칙이 이 문서(CLAUDE.md)보다 **우선**한다. 작업 중 사용자 지적은 확인 후 memory에 누적되고, 필요 시 이 문서에도 반영된다(충돌 시 memory가 이김).

<!-- 통합 브랜치(`branch.integration`)는 항상 로컬 전용 일회용 브랜치(기본 `dam`)다. mainline(main/master)을 integration 으로 쓰지 않는다 — mainline 은 dam 을 복제하는 source 일 뿐이며 `.beaver/.dam-state.json` 에 기록된다. (integration 이 mainline 이면 release 의 `git branch -d` 가 mainline 을 지운다.) -->

---

<!-- 아래는 analyze 가 채우는 규약. 스택에 없는 섹션은 삭제, 깊은 건 docs/ 로 분리. -->

## ⚠️ 주의사항
<!-- 담을 것: Claude 가 절대/조건부로 실행하면 안 되는 명령(서버 기동, 마이그레이션, 배포 등)과 예외.
     깊이: 3~5줄. 프로젝트 운영 규칙이 없으면 섹션 삭제.
     예) `npm run`/`gradle bootRun` 류는 사용자만 실행. 단 테스트 커맨드는 구현 후 Claude 가 직접 실행. -->

## Architecture
<!-- 담을 것: 스택(프레임워크+버전+핵심 의존성) · 디렉터리 레이아웃(역할 주석) · 레이어 경계(누가 누구를 호출)
       · 스택 고유 패턴(DI 등록/주입 토큰, 트랜잭션 래퍼, 스케줄러, import alias) · 새 도메인 최소 파일 구조 + 추가 절차.
     깊이: 본문엔 스택 한 줄 + 트리 요약. 레이어 규칙·패턴 예시·새 도메인 절차는 → docs/architecture.md. -->
→ 상세: [docs/architecture.md](docs/architecture.md)

## Conventions
<!-- 담을 것: 네이밍(엔티티/DTO/모델/util/파일/클래스) · 디렉터리·파일명 규칙 · 라우트 경로 규칙
       · 컨트롤러(핸들러) 입력 파라미터 타입 규칙(any 금지 등) · path/query param 표기(snake/camel) 전 레이어 통일.
     깊이: 충돌 안 나는 명명 공식(`<Domain><Feature><Role>` 등)과 금지 사항을 예시로. 길면 → docs/conventions.md. -->

## 서비스(비즈니스) 계층 규칙
<!-- 담을 것: 서비스 메서드 단위(기능=API 1:1 등) · 재사용/순수 로직의 util 분리 기준 · private 헬퍼 허용/금지 경계.
     깊이: "이 함수가 다른 기능에서도 쓰일 여지가 있는가?" 류의 판단 기준 1~2개를 명문화. ORM/계층 없는 스택이면 간소화. -->

## 공통 로직 분리
<!-- 담을 것: util(순수 함수, stateless) vs module/service(DI·lifecycle·외부연동) 분리 기준. 리팩토링(refactor)의 판단 근거가 됨.
     깊이: 2~4줄. 전역 util 위치 / 도메인 util 위치 / "공통 모듈" vs "공통 로직" 용어 해석. -->

## Data Layer
<!-- 담을 것: 엔티티/모델 규칙(제약 명명 PK/UK/IDX/FK, 컬럼 옵션, 타임스탬프 훅) · repository/DAO 규칙(범용 메서드 우선, where 조립 위치, try/catch)
       · 쿼리/페이지네이션 패턴(단일 메서드 패턴 등) · 트랜잭션 경계 · 조회 DTO 생성자 규칙.
     깊이: 엔티티 템플릿·repository 템플릿·pagination 단계 표는 → docs/data-layer.md (엔티티/repository 가 무거우면 entity.md / repository.md 로 더 쪼개도 됨). ORM/DB 없으면 섹션 삭제. -->
→ 상세: [docs/data-layer.md](docs/data-layer.md)

## Validation
<!-- 담을 것: 검증 방식(데코레이터/스키마/수동) · 필수 옵션(message 강제 등) · 금지 데코레이터·순서 규칙 · 에러 메시지 출처(i18n 키/상수) · validation error key 이름.
     깊이: 3~6줄 + 예시 1개. 다국어면 i18n 섹션과 키 규칙 공유. -->

## Error & Response
<!-- 담을 것: 예외 타입·계층 · throw/catch 위치(repository 통일 문구 vs service 분기) · DB 에러코드 매핑(중복/FK 위반 등) · 통일 응답 래퍼 형태 · 상태코드 정책 · validationErrors 포함 기준(사용자 입력 오류만 등).
     깊이: 본문엔 핵심 원칙. 패턴 코드·에러코드 표·validationErrors 기준표는 → docs/error-handling.md. -->
→ 상세: [docs/error-handling.md](docs/error-handling.md)

## API & Docs
<!-- 담을 것: 라우팅 규칙 · API 문서화(OpenAPI/Swagger 데코레이터 순서·필수 응답 정의) · 핸들러/메서드 주석(JSDoc/Javadoc) 규칙 · void 응답 처리 · 다국어 헤더 등 공통 헤더.
     깊이: 데코레이터 순서·import 경로·DTO 응답 클래스 규칙은 → docs/api.md. API 문서 도구 없으면 섹션 삭제. -->
→ 상세: [docs/api.md](docs/api.md)

## Auth
<!-- 담을 것: 인증/권한 선언 위치(컨트롤러/메서드 가드, 역할 데코레이터) · 로그인 사용자 정보 주입 방식(전용 데코레이터 사용, raw request 금지 등) · 토큰/세션 처리.
     깊이: 3~6줄 + 예시 1개. 인증 없으면 섹션 삭제. -->

## i18n / 다국어
<!-- 담을 것: 라이브러리·언어 수신(헤더/fallback) · 언어팩 파일 구조·키 네이밍 · 번역 헬퍼 사용법 · 코드 주석 규칙(키 옆 원문 병기 등) · HTTP 외 컨텍스트(큐/스케줄러) 처리 · 테스트 시 컨텍스트 주입.
     깊이: 길면 → docs/i18n.md. 다국어 미지원이면 섹션 삭제. -->

## 비동기 / 큐 / 스케줄러
<!-- 담을 것: 큐/메시지 인프라 등록 · 적용 대상(쓰기 메서드 등) · 컨슈머/잡 키 명명 · FIFO/동시성 정책 · 스케줄러 등록 규칙 · 신규 도메인 적용 절차.
     깊이: 길면 → docs/async.md. 비동기 처리 없으면 섹션 삭제. -->

## Key Patterns
<!-- 담을 것: 위 섹션에 안 들어가는 스택 고유 관용 패턴 한 줄씩 (DI 토큰 방식, 트랜잭션 데코레이터, import alias, 모듈 등록 메타데이터 등).
     깊이: 불릿 한 줄씩. 중복되면 Architecture 로 흡수하고 섹션 삭제. -->

## Testing
<!-- 담을 것: 프레임워크 · 위치(파일 규칙) · 단위/통합 방침(mock 범위, 실DB·외부 I/O 금지 여부) · 케이스 구성(SUCCESS/FAIL 분기) · 강도 규칙(호출 횟수·인자·미호출 단언) · 실행 커맨드 · 회귀 실패 처리 정책.
     깊이: 강도 규칙·케이스 샘플링 표는 → docs/testing.md. -->
→ 상세: [docs/testing.md](docs/testing.md)

## Checklist
<!-- 담을 것: 구현(build) 완료 전 점검 항목을 `- [ ]` 로. 위 섹션의 핵심 규칙을 한 줄씩 체크 가능한 형태로 압축.
     깊이: 8~15개. 각 항목은 위반 여부를 코드에서 바로 확인 가능한 구체 규칙이어야 함(추상 구호 금지). -->
- [ ]
