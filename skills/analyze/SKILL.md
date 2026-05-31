---
name: analyze
description: 코드베이스를 분석해 규약 문서(CLAUDE.md + docs/)와 설정(.beaver/config.json)을 생성/갱신한다. "코드베이스 분석", "규약 문서 생성", "beaver 초기화", "analyze codebase" 요청에 발동. 언어 무관(NestJS/Spring/Python 등). 다른 모든 단계의 기반 — 프로젝트당 먼저 1회 실행.
---

# analyze — 코드베이스 분석 → 규약 생성

실제 코드를 읽어 컨벤션을 추출하고 `CLAUDE.md` + `docs/` 규약과 `.beaver/config.json`을 만든다. 이후 모든 단계가 이 산출물을 근거로 삼는다.

## 0. 사전
- 프로젝트 루트 확인(매니페스트 탐색).
- `CLAUDE.md`가 이미 있으면 덮어쓰기 전 확인 — 기존 고유 규칙은 병합, "Beaver 설정" 블록만 갱신.

## 1. 스택 감지
매니페스트로 스택·기본 커맨드 식별(사용자 확인):

| 신호 | test / build |
|---|---|
| package.json(+nest) | `npm test` / `npm run build` |
| pom.xml | `mvn test` / `mvn package` |
| build.gradle | `./gradlew test` / `./gradlew build` |
| pyproject.toml·requirements.txt | `pytest` / — |
| go.mod | `go test ./...` / `go build ./...` |
| Cargo.toml | `cargo test` / `cargo build` |

모노레포면 각각 기록.

## 2. 분석 (멀티 관점)
각 관점은 대표 파일 2~4개를 읽고 근거(경로:라인)와 함께 규칙 보고:
- **architecture** 디렉터리·레이어·모듈 경계·import·진입점
- **conventions** 네이밍·스타일·공통 로직 분리·validation
- **data** 엔티티/모델·repository·쿼리·트랜잭션
- **error/response** 예외·응답 포맷·상태코드
- **api** 라우팅·검증·문서화·인증
- **testing** 프레임워크·위치·케이스 강도·mock

오케스트레이션(가능한 것부터): ① `Workflow` 가능 → 관점 병렬 fan-out 후 종합 ② Task 서브에이전트 → 병렬 분산 ③ 둘 다 불가 → 순차. 전문 에이전트: `${CLAUDE_PLUGIN_ROOT}/agents/`(architecture-mapper, convention-scout, test-pattern-analyzer). 빈 코드베이스면 분석 생략, 스택 기본 규약으로 시작.

## 3. CLAUDE.md + docs/ 생성
`${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` 구조로 작성:
- 모든 규칙은 분석 근거가 있어야 함(추측 금지).
- 안 쓰는 섹션 생략. 깊은 규칙은 `docs/<topic>.md`로 분리 후 링크.
- "## Beaver 설정" 블록은 템플릿 문구 그대로 복사.
- 애매한 항목은 `<!-- TODO -->` 주석.

## 4. .beaver/config.json
```json
{
  "project_name": "...", "stack": ["nestjs"],
  "commands": { "test": "npm test", "test_one": "npm test -- --testPathPatterns=$NAME", "build": "...", "lint": "..." },
  "paths": { "source_root": "src", "test_glob": "**/*.spec.ts" },
  "branch": { "integration": "dam", "stick_prefix": "stick" },
  "self_heal_retry_limit": 10
}
```
`test_one`의 `$NAME`은 단일 테스트 실행 시 치환(pytest면 `pytest -k $NAME`, gradle이면 `./gradlew test --tests *$NAME*`). 커맨드는 사용자 확인. `branch.integration`은 ship의 병합 대상(기본 `dam`, 없으면 plan/ship이 자동 생성). 기존 develop/main 팀은 이 값을 그 이름으로.

## 5. 보고
생성/병합 파일, 도출 근거 요약, 포함/생략 섹션, TODO 목록.
