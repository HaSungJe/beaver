---
name: analyze
description: >-
  코드베이스를 다각도로 정밀 분석해 프로젝트 규약 문서(CLAUDE.md + docs/)와 beaver 설정(.beaver/config.json)을
  생성/갱신한다. "코드베이스 분석", "규약 문서 만들어줘", "beaver 초기화", "analyze codebase",
  "프로젝트 컨벤션 정리" 같은 요청에 발동. NestJS·Spring·Python 등 언어 무관. beaver의 다른 모든
  단계(plan/build 등)가 의존하는 기반 단계 — 신규 프로젝트에서 가장 먼저 1회 실행.
---

# Beaver — Analyze (코드베이스 분석 → 규약 문서 생성)

beaver의 **기반 단계**다. 실제 코드를 다각도로 읽어 프로젝트의 실제 컨벤션을 추출하고, 그것을 **루트 `CLAUDE.md` + `docs/`** 규약 문서와 **`.beaver/config.json`** 설정으로 정리한다. 이후 모든 단계(plan/build/test/commit/refactor)는 이 산출물을 단일 근거로 삼아 **일관된** 결과를 낸다.

> 핵심 철학: 추측이나 브레인스토밍이 아니라 **실제 코드를 읽은 결과**가 규약의 근거다. 코드베이스가 먼저, 규약은 그 위에 선다.

---

## 0. 사전 확인

1. 현재 작업 디렉터리가 프로젝트 루트인지 확인 (`package.json` / `pom.xml` / `build.gradle` / `pyproject.toml` / `go.mod` / `Cargo.toml` 등 매니페스트 탐색).
2. 루트에 `CLAUDE.md` 가 **이미 있으면** → 덮어쓰기 전 사용자에게 보고하고 확인받는다. 기본은 "기존 프로젝트 고유 규칙은 병합, 플러그인 설정 블록만 갱신". 그냥 날리지 않는다.
3. `.beaver/` 디렉터리가 없으면 생성 예정임을 알린다 (산출물·설정 보관소).

---

## 1. 스택 감지 (Detect)

매니페스트와 디렉터리 구조로 1차 스택을 식별한다. 예시 신호:

| 신호 파일 | 스택 | 기본 test 커맨드 | 기본 build 커맨드 |
|---|---|---|---|
| `package.json` (+nest) | NestJS / Node | `npm test` | `npm run build` |
| `pom.xml` | Spring (Maven) | `mvn test` | `mvn package` |
| `build.gradle(.kts)` | Spring (Gradle) | `./gradlew test` | `./gradlew build` |
| `pyproject.toml` / `requirements.txt` | Python | `pytest` | — |
| `go.mod` | Go | `go test ./...` | `go build ./...` |
| `Cargo.toml` | Rust | `cargo test` | `cargo build` |

여러 신호가 섞이면(모노레포) 각각 기록한다. **감지 결과는 추정이므로**, config 작성 시 사용자에게 한 번 확인받는다.

---

## 2. 정밀 분석 — 멀티 에이전트 오케스트레이션

코드베이스를 **여러 관점에서 동시에** 훑는다. 환경에 따라 점진적으로 fallback:

### 2-a. Dynamic Workflow 사용 가능 시 (권장)

`Workflow` 도구를 쓸 수 있으면, 아래 관점을 **병렬 fan-out** 하는 워크플로를 구성해 실행한다. 각 관점은 독립 서브에이전트가 담당하고, 결과를 구조화해 합친다:

- **architecture** — 디렉터리 구조, 레이어 분리(controller/service/repository 등), 모듈 경계, import alias, 진입점
- **conventions** — 네이밍 규칙(파일/클래스/DTO/엔티티), 코드 스타일, 공통 로직 분리 기준(util vs module), validation 패턴
- **data layer** — 엔티티/모델 정의 규칙, repository/DAO 패턴, 쿼리·페이지네이션 컨벤션, 트랜잭션 처리
- **error & response** — 에러 처리 규약, 예외 타입, 응답 포맷, 상태코드 규칙
- **api surface** — 라우팅 규약, 입력 검증(DTO/스키마), 문서화(Swagger/OpenAPI), 인증·인가
- **testing** — 테스트 프레임워크, 파일 위치·명명, 케이스 구성 강도, mock 패턴, 커버리지 관행

각 관점 에이전트는 **대표 파일 2~4개를 실제로 읽고** 근거(파일 경로:라인)를 들어 규칙을 보고하도록 지시한다. 동봉된 전문 에이전트를 활용:
`${CLAUDE_PLUGIN_ROOT}/agents/` 의 `architecture-mapper`, `convention-scout`, `test-pattern-analyzer`.

> Workflow 스크립트는 관점을 항목으로 두고 `pipeline()`/`parallel()` 로 fan-out → 각 결과를 구조화 스키마로 수집 → 합쳐서 규약 초안을 만든다. 빈 코드베이스(신규)면 분석 생략하고 스택 기본 규약으로 시작.

### 2-b. Workflow 불가, Task 서브에이전트 가능 시

위 관점들을 Task 서브에이전트로 병렬 분산해 같은 결과를 모은다(에이전트 정의는 `${CLAUDE_PLUGIN_ROOT}/agents/`).

### 2-c. 둘 다 불가 시 (순차 fallback)

메인 에이전트가 관점 목록을 순서대로 직접 분석한다. 각 관점마다 대표 파일을 읽고 규칙을 메모 → 마지막에 종합.

---

## 3. 규약 문서 생성 (Generate)

분석 결과를 `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 의 섹션 구조에 매핑해 루트 `CLAUDE.md` 를 작성한다.

### 작성 원칙

- **실측 우선** — 모든 규칙은 분석에서 나온 실제 패턴이어야 한다. 코드에 근거가 없는 규칙은 넣지 않는다.
- **안 쓰는 섹션은 생략** — 큐가 없으면 큐 섹션 없음, ORM이 없으면 repository 섹션 없음.
- **상세는 `docs/` 로 분리** — `CLAUDE.md` 는 요약 + bullet, 깊은 규칙은 `docs/<topic>.md` 로 빼고 `→ 상세: docs/xxx.md` 링크.
- **플러그인 설정 블록은 그대로** — `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 의 "## Beaver 설정" 섹션(라우팅·메모리)은 문구 그대로 복사. beaver 동작에 필수.
- **애매한 항목은 TODO 주석** — 판단이 모호하면 삭제하지 말고 `<!-- TODO: 확인 필요 -->` 로 남긴다.

### docs/ 구성 (해당 기술 쓸 때만)

`architecture.md`, `conventions.md`, `data-layer.md`, `error-handling.md`, `api-and-validation.md`, `testing.md` 중 프로젝트가 실제로 쓰는 것만 생성.

---

## 4. beaver 설정 작성 (`.beaver/config.json`)

다언어 대응의 핵심. 감지·확인된 값을 기록해 이후 단계(특히 self-heal 훅)가 언어 무관하게 동작하게 한다:

```json
{
  "project_name": "<감지된 프로젝트명>",
  "stack": ["nestjs"],
  "commands": {
    "test": "npm test",
    "test_one": "npm test -- --testPathPatterns=$NAME",
    "build": "npm run build",
    "lint": "npm run lint"
  },
  "paths": {
    "source_root": "src",
    "test_glob": "**/*.spec.ts"
  },
  "branch": {
    "integration": "dam",
    "stick_prefix": "stick"
  },
  "conventions_doc": "CLAUDE.md",
  "self_heal_retry_limit": 10
}
```

`branch.integration` 은 ship의 병합 대상(통합 브랜치, 기본 `dam`), `branch.stick_prefix` 는 plan이 만드는 작업 브랜치 접두사(기본 `stick`)다. 통합 브랜치가 로컬에 없으면 plan/ship이 **자동 생성**한다(원격에 있으면 추적, 없으면 메인라인에서 새로 만듦). 기존에 `develop`/`main`을 통합 브랜치로 쓰던 팀이면 `branch.integration` 을 그 이름으로 바꾼다.

`test_one` 의 `$NAME` 은 단일 기능 테스트 실행 시 치환되는 자리표시자다. 스택별로 적절히 채운다(pytest면 `pytest -k $NAME`, gradle이면 `./gradlew test --tests *$NAME*` 등). **반드시 사용자에게 최종 확인**받는다.

---

## 5. 완료 보고

- 생성/병합된 파일: `CLAUDE.md`(섹션 N개), `docs/`(파일 M개), `.beaver/config.json`
- 어떤 분석 관점에서 어떤 규칙을 도출했는지 요약 (근거 파일 경로 포함)
- 포함/생략/축약한 섹션과 그 이유
- 남긴 TODO 항목 목록
- 다음 단계 안내: "이제 `/beaver:plan <기능명>` (또는 '<기능명> 계획해줘') 으로 첫 기능을 기획하세요."

---

## 관련

- 다음 단계: [plan](../plan/SKILL.md)
- 템플릿: `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md`
- 분석 에이전트: `${CLAUDE_PLUGIN_ROOT}/agents/`
