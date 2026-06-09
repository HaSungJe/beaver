---
name: analyze
description: 코드베이스를 분석해 규약 문서(CLAUDE.md + docs/)와 설정(.beaver/config.json)을 생성/갱신한다. "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase" 요청에 발동. 언어 무관(NestJS/Spring/Python 등). 기존 프로젝트면 코드에서, 신규 프로젝트면 프레임워크 표준에서 규약을 도출. 다른 단계의 기반 — 프로젝트당 먼저 1회.
---

# analyze — 규약 생성 (코드 우선, 없으면 프레임워크 표준)

**원칙: 코드가 있으면 코드가 규칙, 없으면 프레임워크 표준이 규칙.** 이를 근거로 `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json`을 만든다. 이후 모든 단계가 이 산출물을 따른다.

## 0. 사전
- 프로젝트 루트 확인. `CLAUDE.md` 있으면 덮어쓰기 전 확인(고유 규칙 병합, "Beaver 설정" 블록만 갱신).
- **memory 병합**: `.beaver/memory/`(MEMORY.md + 토픽)가 있으면 읽어 사용자 규칙을 **최우선**으로 반영. `CLAUDE.md 반영: 미반영` 엔트리는 해당 섹션/docs에 정식 반영 제안 후 `반영됨`으로 갱신(코드외 순수 선호는 `불필요`로 memory 영속). 충돌 시 코드 실측보다 memory 사용자 결정이 우선. 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 1. 스택·환경 감지
매니페스트로 프레임워크·버전·핵심 의존성·test/build 커맨드 식별(사용자 확인):

| 신호 | test / build |
|---|---|
| package.json(+nest) | `npm test` / `npm run build` |
| pom.xml | `mvn test` / `mvn package` |
| build.gradle | `./gradlew test` / `./gradlew build` |
| pyproject.toml·requirements.txt | `pytest` / — |
| go.mod | `go test ./...` / `go build ./...` |
| Cargo.toml | `cargo test` / `cargo build` |

## 1.5 미정 영역 선택 (인터랙티브)
코드로 **확정되지 않은 스택 결정 포인트**를 모델이 감지한 프레임워크 기준으로 동적 도출한다(예: ORM 사용 여부→`typeorm`/`prisma`/none, auth 전략, 캐시 등). 신규/빈 프로젝트 전체 + 기존 프로젝트의 미정 영역에 적용.
- **진짜 대안이 2개 이상일 때만 질문**한다. 프레임워크 권장안을 **첫 옵션에 "(권장)"** 표시.
- **단일 표준**(대안 사실상 없음, 예: NestJS validation=`class-validator`)은 **질문하지 않고 자동 채택 + 한 줄 알림**.
- 코드로 이미 확정된 영역은 묻지 않는다(실측이 우선).
- 선택 결과는 §4 config `stack` + CLAUDE.md 규약에 반영하고, 출처를 `(선택: 사용자)` 또는 `(표준: <프레임워크> 권장)`으로 표기(코드 근거 아님 명시).

## 2. 분석 방침 — 코드 유무로 갈림
- **기존 코드베이스**(의미 있는 소스 존재) → **실측 분석**: 아래 관점을 대표 파일 2~4개 읽어 근거(경로:라인)와 함께 규칙 추출.
- **신규/빈 프로젝트**(매니페스트만, src 없음/미미) → 감지한 프레임워크의 **표준·권장 구조·컨벤션 채택**. 예:
  - NestJS — 도메인별 module/controller/service/repository, class-validator DTO, 전역 ValidationPipe
  - Spring — 계층형 controller/service/repository, DTO·Entity 분리, `@RestControllerAdvice` 예외 처리
  - 그 외 — 해당 생태계의 관용 레이아웃·린트·테스트 관행
- **부분적** → 있는 건 실측, 빈 영역은 표준으로 보완.
- 규칙마다 출처 표기: 실측이면 근거 파일, 표준이면 `(표준: <프레임워크> 권장)`.

### 실측 시 함정 방지 (필수)
- **용례 0건 자산은 시그니처 직독·날조 금지**: 코드 어디서도 호출되지 않는 공통 util·베이스/추상 클래스·데코레이터는 *호출 예시를 지어내지 말 것*. 정의 파일을 Read 해 시그니처(생성자 인자 형태·메서드 반환)만 사실대로 적고, 적용 0건이면 **"미적용/규약"** 으로 표기한다. (인자 순서·이름을 상상해 `new X(a,b)` 식 예시를 만들면 실제 `new X({...})` 와 어긋나 거의 틀린다.)
- **`extends`/상속 추적**: 파생 DTO·클래스의 규칙(생성자 시그니처·필수 할당 등)이 베이스에만 있을 수 있으니 베이스 정의도 Read.
- **금지·생략 규칙 적극 탐지**: "무엇을 한다"뿐 아니라 "무엇을 *안* 한다"(미사용 옵션·금지 데코레이터·금지 호출 형태)도 규칙이다. grep 으로 부재를 확인해 포착하고, 동일 유형 파일 2개 이상에서 교차확인해 마이크로 규칙(데코레이터 순서·경로 슬래시·파라미터 한 줄 등) 누락을 막는다.
- **구현됐으나 미적용 = 정직 표기**: 만들어졌지만 적용 0건인 인프라(가드·큐 데코레이터·스케줄러 등)는 usage grep 후 "미적용/규약"으로. 적용된 것처럼 서술(over-claim)하지 말 것.

관점: architecture / conventions / data / error·response / api / testing.
실측 분석은 fan-out으로(병렬 우선: Workflow 병렬 / Task 분산 / 불가 시 순차). 에이전트 `${CLAUDE_PLUGIN_ROOT}/agents/`(architecture-mapper, convention-scout, test-pattern-analyzer).

## 3. CLAUDE.md + docs/ 생성
`${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 구조로 작성. 깊은 규칙은 `${CLAUDE_PLUGIN_ROOT}/templates/docs/*.md` 스킬레톤(architecture/conventions/data-layer/error-handling/api/testing)을 골격으로 `docs/<topic>.md`에 채운다.
- 각 섹션/스킬레톤의 주석에 적힌 "담을 것 / 깊이"를 충족. 규칙 1~2줄은 본문에, 예시·표·절차가 필요한 깊은 규칙은 docs/로 분리하고 본문엔 `→ 상세:` 링크만.
- 안 쓰는 섹션·docs는 통째로 삭제(빈 헤더 남기지 말 것). 데이터/엔티티가 무거운 스택은 `data-layer.md`를 `entity.md`/`repository.md`로 더 쪼개도 됨.
- "## Beaver 설정" 블록은 템플릿 문구 그대로 복사.
- 표준으로 채택한 항목은 실제 코드가 쌓이면 갱신될 수 있음(필요 시 `<!-- TODO -->`).

**완성도 기준**: 각 섹션이 "이 규칙만 보고 새 도메인 1개를 규약대로 만들 수 있는가?"를 통과할 깊이여야 한다. 규칙마다 근거(실측 경로 또는 표준 표기)를 달고, 핵심 규칙은 예시 코드·표·절차까지 docs/에 채운다.

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "stick_prefix": "stick" },
  "self_heal_retry_limit": 5
}
```
`test_one`의 `$NAME`은 단일 테스트 실행 시 치환(pytest면 `pytest -k $NAME` 등). 커맨드는 사용자 확인. `stack`에는 §1.5에서 선택/채택한 스택을 포함한다.

**`branch.stick_prefix`는 stick 브랜치/워크트리 접두(기본 `stick`)다.** plan이 `<stick_prefix>/<domain>-<rand6>`(예: `stick/user-a3f9c2`) 으로 `.claude/worktrees/`에 stick을 격리 생성하고, stick↔원래 작업 브랜치 매핑을 `.beaver/.auto-branch-state.json`에 기록한다. 별도 통합 브랜치 개념은 없다 — stick의 격리·병합·파기는 plan/ship이 담당한다(→ ship §3). analyze는 이 값을 config에 기록만 하고 워크트리는 만들지 않는다.

## 5. 보고
생성/병합 파일, 규칙 출처 비중(실측 vs 표준), 포함/생략 섹션, TODO 목록.
