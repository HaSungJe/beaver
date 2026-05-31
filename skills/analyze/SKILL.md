---
name: analyze
description: 코드베이스를 분석해 규약 문서(CLAUDE.md + docs/)와 설정(.beaver/config.json)을 생성/갱신한다. "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase" 요청에 발동. 언어 무관(NestJS/Spring/Python 등). 기존 프로젝트면 코드에서, 신규 프로젝트면 프레임워크 표준에서 규약을 도출. 다른 단계의 기반 — 프로젝트당 먼저 1회.
---

# analyze — 규약 생성 (코드 우선, 없으면 프레임워크 표준)

**원칙: 코드가 있으면 코드가 규칙, 없으면 프레임워크 표준이 규칙.** 이를 근거로 `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json`을 만든다. 이후 모든 단계가 이 산출물을 따른다.

## 0. 사전
- 프로젝트 루트 확인. `CLAUDE.md` 있으면 덮어쓰기 전 확인(고유 규칙 병합, "Beaver 설정" 블록만 갱신).

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

## 2. 분석 방침 — 코드 유무로 갈림
- **기존 코드베이스**(의미 있는 소스 존재) → **실측 분석**: 아래 관점을 대표 파일 2~4개 읽어 근거(경로:라인)와 함께 규칙 추출.
- **신규/빈 프로젝트**(매니페스트만, src 없음/미미) → 감지한 프레임워크의 **표준·권장 구조·컨벤션 채택**. 예:
  - NestJS — 도메인별 module/controller/service/repository, class-validator DTO, 전역 ValidationPipe
  - Spring — 계층형 controller/service/repository, DTO·Entity 분리, `@RestControllerAdvice` 예외 처리
  - 그 외 — 해당 생태계의 관용 레이아웃·린트·테스트 관행
- **부분적** → 있는 건 실측, 빈 영역은 표준으로 보완.
- 규칙마다 출처 표기: 실측이면 근거 파일, 표준이면 `(표준: <프레임워크> 권장)`.

관점: architecture / conventions / data / error·response / api / testing.
오케스트레이션(실측 시): Workflow→병렬 fan-out / Task→분산 / 순차. 에이전트 `${CLAUDE_PLUGIN_ROOT}/agents/`(architecture-mapper, convention-scout, test-pattern-analyzer).

## 3. CLAUDE.md + docs/ 생성
`${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 구조로 작성:
- 안 쓰는 섹션 생략. 깊은 규칙은 `docs/<topic>.md`로 분리·링크.
- "## Beaver 설정" 블록은 템플릿 문구 그대로 복사.
- 표준으로 채택한 항목은 실제 코드가 쌓이면 갱신될 수 있음(필요 시 `<!-- TODO -->`).

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "integration": "dam", "stick_prefix": "stick" },
  "self_heal_retry_limit": 5
}
```
`test_one`의 `$NAME`은 단일 테스트 실행 시 치환(pytest면 `pytest -k $NAME` 등). 커맨드는 사용자 확인. `branch.integration` 없으면 plan/ship이 자동 생성.

## 5. 보고
생성/병합 파일, 규칙 출처 비중(실측 vs 표준), 포함/생략 섹션, TODO 목록.
