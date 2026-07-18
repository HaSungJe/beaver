---
name: analyze
description: 코드베이스를 분석해 규약 문서(CLAUDE.md + docs/)와 설정(.beaver/config.json)을 생성/갱신한다. "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase" 요청에 발동. 언어 무관 — 게임 엔진 포함 모든 스택(NestJS/Spring/Python/Unity/Unreal 등). 기존 프로젝트면 코드에서, 신규 프로젝트면 프레임워크 표준에서 규약을 도출. 다른 단계의 기반 — 프로젝트당 먼저 1회.
---

# analyze — 규약 생성 (코드 우선, 없으면 프레임워크 표준)

**원칙: 코드가 있으면 코드가 규칙, 없으면 프레임워크 표준이 규칙.** `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json`을 만든다; 이후 모든 단계가 이 산출물을 따른다.

## 0. 사전
- 프로젝트 루트 확인. `CLAUDE.md` 있으면 덮어쓰기 전 확인(고유 규칙 병합; 구버전의 "## Beaver 설정" 블록이 있으면 제거 — 해당 동작은 이제 플러그인 자체가 제공).
- **memory 병합**: `.beaver/memory/`가 있으면 읽어 사용자 규칙을 **최우선** 반영. `CLAUDE.md 반영: 미반영` 엔트리는 해당 섹션/docs에 정식 반영 제안 후 `반영됨` 갱신(코드외 순수 선호는 `불필요` 유지). 충돌 시 코드 실측보다 memory의 사용자 결정이 우선. 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 1. 스택·환경 감지
매니페스트로 프레임워크·버전·핵심 의존성·test/build 커맨드 식별(사용자 확인):

| 신호 | test / build |
|---|---|
| package.json(+nest) | `npm test` / `npm run build` |
| package.json(+next) + `next.config.*` + `app/`(또는 `pages/`) 디렉터리 | `npm test`(vitest/jest+RTL; E2E는 Playwright/Cypress) / `next build` |
| pom.xml | `mvn test` / `mvn package` |
| build.gradle | `./gradlew test` / `./gradlew build` |
| pyproject.toml·requirements.txt | `pytest` / — |
| go.mod | `go test ./...` / `go build ./...` |
| Cargo.toml | `cargo test` / `cargo build` |

감지는 언어·프레임워크·포지션 무관 — 프론트엔드·모바일·CLI·라이브러리 프로젝트도 동일 신호(매니페스트 + 프레임워크 설정 + 진입표면 디렉터리)로 감지한다.

**표는 예시일 뿐 화이트리스트가 아니다.** 표 밖의 신호 — 게임/그래픽 엔진 등 어떤 스택이든(Unity `ProjectSettings/ProjectVersion.txt` + `Assets/`, Unreal `*.uproject`, Godot `project.godot`, …) — 도 같은 방식으로 감지한다: 프로젝트 자체의 엔진/빌드 파일로 스택을 식별하고, test/build 커맨드는 프로젝트가 실제로 돌리는 것(CI 단계, Makefile/스크립트, 엔진 CLI 배치 실행 — 예: Unity `-runTests -batchmode`, Unreal Automation)에서 도출해 사용자에게 확인받는다. 에디터가 자동 생성한 부산물(Unity 프로젝트의 `.csproj`/`.sln`)이 엔진 신호를 덮어쓰지 않는다. 실행 가능한 커맨드가 없는 스택(에디터 전용 테스트, 빌드만 존재)은 있는 것만 기록한다 — 지어내지 말고 비워 둔다.

아래 어휘는 포지션 중립: LAYER/UNIT = 책임 분리 단위; ENTRY POINT = 외부 도달 표면; DATA/AFFECTED STATE = 읽고/바꾸는 상태(persist OR fetch remote data); OUTCOME/INTERFACE CONTRACT = 진입점이 만드는 결과. 각각 이 프로젝트가 실제로 쓰는 것을 코드 근거(경로:라인)로 도출하고 프로젝트가 쓰는 이름 그대로 쓴다 — 포지션별 고정 카탈로그를 가정하지 않는다.

## 1.5 미정 영역 선택 (인터랙티브)
**코드로 확정되지 않은** 스택 결정 포인트의 선택지를 감지한 프레임워크의 관용 베이스라인에서 도출한다(ORM 선택, auth 전략, 캐시 등) — 신규/빈 프로젝트 전체 + 기존 프로젝트의 미정 영역. 이 프로젝트가 실제로 마주하는 결정 포인트만 노출한다.
- 진짜 대안이 2개 이상일 때만 질문; 프레임워크 권장안을 **첫 옵션에 "(권장)"** 표시.
- 단일 표준(예: NestJS validation=`class-validator`) → 질문 없이 자동 채택 + 한 줄 알림.
- 코드로 확정된 영역은 묻지 않는다 — 실측이 우선.
- 결과는 §4 config `stack` + CLAUDE.md 규약에 반영, 출처를 `(선택: 사용자)` 또는 `(표준: <프레임워크> 권장)`으로 표기.

## 2. 분석 방침 — 코드 유무로 갈림
> **코드베이스에 실제로 있는 것만 문서화 — 없는 건 배제.** 안 쓰는 인프라(큐, 스케줄러, 트랜잭션, DI 컨테이너, i18n, 캐시, guard; 프론트엔드면 미사용 상태 라이브러리·middleware·error boundary)를 미리 채우지 않는다 — 실제 추가될 때 문서화한다. 그런 게 없는 프로젝트는 해당 섹션이 없는 게 정상이지 누락이 아니다.
- **기존 코드베이스** → **실측 분석**: 관점별 대표 파일 2~4개를 읽어 근거(경로:라인)와 함께 규칙 추출. 있는 것만.
- **신규/빈 프로젝트** → 시작에 필요한 감지 프레임워크의 관용 베이스라인만 채택(관용 레이아웃 + lint/test 커맨드); 인프라를 지어내지 않고 포지션별 고정 구문 카탈로그를 나열하지 않는다.
- **부분적** → 있는 건 실측, 빈 영역은 표준으로 보완.
- 규칙마다 출처 표기: 실측이면 근거 파일, 표준이면 `(표준: <프레임워크> 권장)`.

### 실측 시 함정 방지 (필수)
- **용례 0건 자산: 호출 예시 날조 금지.** 아무도 호출하지 않는 공통 util·베이스 클래스·데코레이터는 정의를 읽어 시그니처만 사실대로 적고 "미적용/규약"으로 표기한다. 상상해 만든 `new X(a,b)` 식 예시는 실제 `new X({...})`와 어긋나 거의 틀린다.
- **`extends`/상속 추적** — 파생 클래스의 규칙(생성자 시그니처·필수 할당)이 베이스에만 있을 수 있으니 베이스 정의도 읽는다.
- **금지·생략 규칙 탐지** — 코드가 *안* 하는 것(미사용 옵션·금지 데코레이터·금지 호출 형태)도 규칙이다; grep으로 부재를 확인하고, 동일 유형 파일 2개+ 교차확인으로 마이크로 규칙(데코레이터 순서·경로 슬래시·파라미터 한 줄 등) 누락을 막는다.
- **구현됐으나 미적용 = 정직 표기** — usage grep 후 "미적용/규약"으로; 적용된 것처럼 서술(over-claim)하지 말 것.

관점은 각각 LAYER/UNIT 도출 시점이며 감지한 스택이 실제로 쓰는 것에 매핑한다(backend 전용 명사 아님): architecture(LAYER/UNIT 맵) / conventions / data(DATA/AFFECTED STATE) / error·response(OUTCOME/INTERFACE CONTRACT) / api(ENTRY POINT) / testing.
실측 분석은 fan-out으로(병렬 우선: Workflow 병렬 / Task 분산 / 불가 시 순차). 에이전트 `${CLAUDE_PLUGIN_ROOT}/agents/`(architecture-mapper, convention-scout, test-pattern-analyzer).

## 3. CLAUDE.md + docs/ 생성
`${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 구조로 작성; 깊은 규칙은 `${CLAUDE_PLUGIN_ROOT}/templates/docs/*.md` 스킬레톤(architecture/conventions/data-layer/error-handling/api/testing)을 골격으로 `docs/<topic>.md`에 채운다.
- 규칙 1~2줄은 본문에; 예시·표·절차가 필요한 깊은 규칙은 docs/로 분리하고 본문엔 `→ 상세:` 링크만.
- 안 쓰는 섹션·docs는 통째로 삭제(빈 헤더 금지). 데이터가 무거운 스택은 `data-layer.md`를 `entity.md`/`repository.md`로 쪼개도 됨.
- **testing.md에 mock 경계 사각지대 명시 필수**: 단위 테스트가 data-access 레이어를 mock하면 그 레이어의 쿼리 매핑은 어느 spec에서도 실행되지 않는다 — 이를 명시하고 "Data-Access 스모크" 섹션을 채운다(스택이 지원하면 무연결 쿼리/metadata 빌드 규약, 예: TypeORM `buildMetadatas()`+`getSql()`; 없으면 실DB 대안; data-access 레이어가 없는 프로젝트만 섹션 삭제).
- 표준 채택 항목은 코드가 쌓이면 갱신될 수 있음(필요 시 `<!-- TODO -->`).

**완성도 기준**: 각 섹션이 "이 규칙만 보고 새 도메인 1개를 규약대로 만들 수 있는가?"를 통과할 깊이 — 규칙마다 근거(실측 경로 또는 표준 표기), 핵심 규칙은 예시 코드·표·절차까지 docs/에.

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "stick_prefix": "stick" },
  "auto_approve": true
}
```

**config 디폴트(위 JSON은 한 예시; JSON 안에 주석 금지)**: `stack`·`source_root`·`test_glob`과 `build`/`test`/`test_one` 커맨드는 이 프로젝트가 실제로 쓰는 것을 코드/매니페스트(경로:라인)에서 도출하고, 코드로 확정 안 되는 부분은 프레임워크 베이스라인으로 보완한다. `test_one`의 `$NAME`은 그 프로젝트 러너가 기대하는 방식대로 단일 테스트에 치환한다(pytest면 `pytest -k $NAME` 등). data-access 스모크 스위트를 분리해 두면(또는 docs/testing.md로 채택하면) `commands.test_smoke`로 기록한다. 커맨드는 사용자 확인. `stack`에는 §1.5 선택을 포함.

**워크트리 의존성 주입 없음** — stick에는 의존성 디렉터리(`node_modules`, `.venv`, `vendor`, …)를 채우지 않는다; 워크트리에서 코드를 실행하는 단계가 없다(build는 테스트 작성만; 회귀는 `/beaver:test`에서 의존성 갖춘 실제 체크아웃 위에서 돈다).

**`auto_approve`(기본 `true`)** — beaver의 PreToolUse 훅(`scripts/auto-approve.js`)이 **프로젝트 내 파일 편집**(`Write`/`Edit`/`MultiEdit`/`NotebookEdit`)을 자동 승인해 plan/build/ship이 매 편집마다 승인창을 띄우지 않는다. **`Bash`는 절대 자동승인 안 함** — 테스트·`git push`·프로젝트 밖 파일 편집은 여전히 확인. `"auto_approve": false`로 매 편집 확인 복귀.

**`.gitignore` 시드(필수, 멱등)** — 프로젝트 `.gitignore`에 `.beaver/.auto-branch-state.json` 라인을 보장한다(없으면 추가, 파일 없으면 생성, 있으면 넘어감).

**`branch.stick_prefix`** — stick 브랜치/워크트리 접두(기본 `stick`). plan이 `<stick_prefix>/<domain>-<rand6>`으로 `.claude/worktrees/`에 stick을 만들고 stick↔원래 브랜치 매핑을 `.beaver/.auto-branch-state.json`에 기록한다; 격리·병합·파기는 plan/ship 담당(→ ship §3). analyze는 이 값을 기록만 한다.

## 5. 보고
생성/병합 파일, 규칙 출처 비중(실측 vs 표준), 포함/생략 섹션, TODO 목록.
