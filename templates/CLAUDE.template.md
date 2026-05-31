<!--
  Beaver — generated project convention spec (template).
  이 템플릿은 `/beaver:analyze` 가 코드베이스를 분석해 채우는 **섹션 구조와 톤의 참고용 골격**이다.
  실제 생성 시:
  - 모든 규칙은 분석에서 나온 실제 패턴으로 치환 (코드 근거 없는 규칙 금지)
  - 프로젝트가 안 쓰는 섹션은 통째로 삭제
  - 깊은 규칙은 docs/<topic>.md 로 분리하고 `→ 상세: docs/xxx.md` 로 링크
  - "## Beaver 설정" 섹션은 문구 그대로 유지 (beaver 동작 설명)
-->

# CLAUDE.md

## Beaver 설정

이 프로젝트는 [Beaver](https://github.com/HaSungJe/beaver) 플러그인으로 관리된다. 아래는 beaver 동작 안내이며 코드 컨벤션과 별개다.

### 명령(skill) 진입점

각 단계는 **슬래시 커맨드**와 **자연어** 두 가지로 호출된다(동일 동작):

| 사이클 | 단계 | 슬래시 | 자연어 예시 |
|---|---|---|---|
| 기반(1회) | 코드베이스 분석 | `/beaver:analyze` | "코드베이스 분석해줘", "규약 문서 만들어줘" |
| 작은 사이클 | 기능 기획 | `/beaver:plan <기능명>` | "<기능명> 기획해줘", "기능 생성/수정" |
| 작은 사이클 | 구현 | `/beaver:build` | "작업 시작", "구현해줘" |
| 큰 사이클 | 커밋+푸쉬+병합 | `/beaver:ship` | "커밋하고 푸쉬", "dam에 병합", "작업 마무리" |
| ↳ ship 내 자동 | 충돌 해결 | `/beaver:resolve` | "충돌 해결해줘" (dam 병합 충돌 시 ship이 자동 발동) |
| 상시 | 리팩토링 | `/beaver:refactor` | "비슷한 기능 묶어줘", "중복 정리" |

> beaver skill은 자동 발동된다 — 위 자연어가 요청에 들어오면 별도 라우팅 블록 없이도 해당 skill이 실행된다. 명시적으로 슬래시를 써도 동일하게 동작한다.

### 사이클 구조

- **작은 사이클(작업 단위)** — `plan → build` 를 한 묶음으로, 한 `stick/...` 브랜치(통나무) 위에서 여러 번 반복해 작업을 누적한다. build는 **커밋하지 않는다**(구현·테스트만).
- **큰 사이클(배포 단위)** — 누적된 작업을 `/beaver:ship` 한 번으로 커밋 → 푸쉬 → 통합 브랜치 `dam`(base) 병합한다. 병합 중 충돌이 나면 `/beaver:resolve` 가 ship 안에서 자동 발동돼 규약에 맞게 통합한다.

### 산출물·설정 위치

- 설정: `.beaver/config.json` (스택·테스트 커맨드·경로 규약)
- 기획/구현 산출물: `.beaver/output/{spec,plan,revision,report}/<domain>/`, 리팩토링 계획: `.beaver/output/refactor/`

### 메모리 시스템

프로젝트 공유 메모리는 `.beaver/memory/` 에 둔다(팀 공유 가능). 인덱스는 `.beaver/memory/MEMORY.md`. 코드를 보면 알 수 있는 내용·기능 단위 작업 현황은 저장하지 않는다.

---

<!-- 아래부터는 analyze가 코드 분석으로 채우는 규약. 예시 섹션 — 실제 프로젝트에 맞게 치환/생략. -->

## Architecture

<!-- 스택 한 줄 + 디렉터리 구조 + 레이어 분리. → 상세: docs/architecture.md -->

## Conventions (Naming & Style)

<!-- 파일/클래스/식별자 네이밍, 라우팅 규약, 코드 스타일. → 상세: docs/conventions.md -->

## 공통 로직 분리 규칙

<!-- util vs module/service 분리 기준. 리팩토링(비슷한 기능 묶기)의 근거가 되는 핵심 규칙. -->

## Data Layer

<!-- 엔티티/모델 정의, repository/DAO 패턴, 쿼리·페이지네이션, 트랜잭션. → 상세: docs/data-layer.md. ORM 없으면 삭제. -->

## Validation

<!-- 입력 검증 방식, 메시지 규칙, error-key 규약. -->

## Error Handling & Response

<!-- 예외 타입, throw/catch 위치, 통일 메시지, 응답 포맷, 상태코드. → 상세: docs/error-handling.md -->

## API & Docs

<!-- 라우팅, OpenAPI/Swagger, 인증·인가. → 상세: docs/api-and-validation.md. 해당 없으면 삭제. -->

## Testing

<!-- 프레임워크, 위치·명명, 케이스 구성·강도, mock 패턴. → 상세: docs/testing.md -->

## Checklist

<!-- 구현 시 점검할 핵심 규칙들을 - [ ] 로. analyze가 위 섹션에서 도출. -->
