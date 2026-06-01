# Beaver Memory 프로토콜

작업 중 사용자가 지적·교정한 **지속 규칙(선호·오버라이드)** 을 `.beaver/memory/` 에 누적하고, 이후 모든 단계가 이를 **최우선**으로 따른다. 모든 skill(analyze/plan/build/refactor/resolve/ship)이 이 프로토콜을 공유한다.

## 저장소 구조

```
.beaver/memory/
├── MEMORY.md        # 인덱스: 엔트리 한 줄 요약 + 토픽 링크
└── <topic>.md       # 토픽별 규칙 누적 (error-handling.md, naming.md, testing.md ...)
```

토픽명은 CLAUDE.md 섹션/관심사에 맞춘다(error-handling, naming, data-layer, testing, validation, api, auth, async ...).

## 엔트리 포맷 (`<topic>.md`)

한 토픽 파일에 규칙을 `##` 블록으로 누적:

```markdown
# error-handling

## UK/FK 제약 위반은 repository 에서만 핸들링
- 규칙: UK/FK(errno 1062/1452) 분기는 repository 에서만 처리. service 에서 중복으로 분기 금지.
- 범위: 전역
- 근거: 사용자 지적 2026-06-01 — "service 말고 repository에서만 UK,FK 마다 핸들링"
- CLAUDE.md 반영: 미반영 (현 error-handling 규약과 충돌 → 반영 제안 대상)
- 우선순위: CLAUDE.md/기본보다 우선
```

필드:
- **규칙** — 사용자가 원하는 동작, 명령형 한 줄.
- **범위** — `전역` 또는 `<domain>`.
- **근거** — `사용자 지적 <YYYY-MM-DD> — "<인용>"`.
- **CLAUDE.md 반영** — `미반영` / `반영됨(<섹션/파일>)` / `불필요(코드외 선호)`.
- **우선순위** — 항상 CLAUDE.md/기본보다 우선.

## 저장 대상

- **저장 O** — 코드만으론 알 수 없는 지속 선호/오버라이드. (계층 배치 선호, 금지 패턴, 네이밍 취향, 특정 라이브러리 회피 등)
- **저장 X** — ① 코드로 바로 알 수 있는 사실(analyze가 잡음) ② 일회성 지시("이번만", "이 PR만").

## Capture (지적 발생 시 — 확인 후 저장)

1. **감지** — 사용자가 구현/구조/규약을 교정하거나 "X 말고 Y로" 식 선호를 표명. *지속 규칙*으로 판단되면(일회성 아님) 진행.
2. **확인** — 한 줄로: `이 규칙 .beaver/memory/<topic>.md 에 저장할까? (이후 작업서 우선 적용)`. 거부면 이번 작업에만 적용하고 저장 안 함.
3. **저장** — 승인 시 `<topic>.md` upsert + `MEMORY.md` 인덱스 갱신.
   - 같은 규칙 있으면 갱신. 모순되면 최신으로 교체하고 근거 줄에 변경 이력 한 줄 남김.
4. **CLAUDE.md 반영 제안** — 그 규칙이 CLAUDE.md/docs 규약과 **충돌하거나 보강**하면: `CLAUDE.md <섹션>에도 반영할까?` 제안. **즉시 고치지 않는다** — build/refactor 중엔 memory 규칙을 우선 적용만 하고, 정식 반영은 승인 시 또는 ship/analyze 단계에서 처리. 코드외 순수 선호면 `불필요`로 표기하고 memory에만 영속.

## Read / 우선순위 (모든 skill 진입 시 필수)

- 진입하면 먼저 `.beaver/memory/MEMORY.md` + 관련 토픽 파일을 읽는다.
- 적용 우선순위: **memory > CLAUDE.md/docs > 프레임워크 기본/추론**. 충돌 시 memory 규칙을 적용한다.
- build/refactor 구현 시 memory 규칙을 CLAUDE.md 규약과 동등 이상(우선)으로 강제. 리뷰/검증도 memory 기준으로 함께 점검.

## Reconcile (정식 반영)

- **ship** 코드리뷰 단계, **analyze** 재생성 시: `CLAUDE.md 반영: 미반영` 엔트리를 훑어 CLAUDE.md/docs 정식 반영을 제안.
  - 반영 승인 → 해당 섹션 수정 후 엔트리를 `반영됨(<섹션>)` 으로 갱신.
  - 코드외 순수 선호 → `불필요`로 두고 memory에 영속(반영 안 함).
- 목표: memory는 "아직 규약 문서에 안 들어간 사용자 결정"의 버퍼이자, 코드외 선호의 영속 저장소.
