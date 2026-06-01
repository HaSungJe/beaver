---
name: plan
description: 기능을 기획해 문서(spec → plan, 변경이면 revision)를 작성한다. "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature" 요청에 발동. 신규/변경 자동 판별. analyze가 만든 CLAUDE.md 규약이 있어야 동작.
---

# plan — 기능 기획 (spec → plan / revision)

## 0. 전제
- `CLAUDE.md` 필요. 없으면 중단하고 `/beaver:analyze` 안내.
- `.beaver/config.json`에서 경로·`branch` 설정을 읽는다.
- **memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 기획에 **최우선** 반영(memory > CLAUDE.md). 기획 중 사용자가 지속 규칙을 지적하면 확인 후 저장 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.

## 1. 모드 판별
대상 기능명으로:
- 같은 기능의 `plan.md` + `report.md` 존재(구현 완료) → **변경 모드**(revision).
- 그 외 → **신규 모드**(spec → plan).
애매하면 사용자 확인.

## 2. 브랜치
plan 시작 시 작업 브랜치(stick)를 자동 생성한다:
- 현재 브랜치가 이미 `.beaver/.auto-branch-state.json` 키(= beaver stick)면 → 그대로 누적(새로 안 만듦).
- 아니면 base = `branch.integration`(기본 `dam`, 로컬 전용 일회용 통합 브랜치):
  - **가드**: `branch.integration` 값이 mainline/원격 추적 브랜치(`main`/`master`/`origin/*`)면 **중단** — config 오설정. integration은 일회용 로컬 dam 전용이고 mainline은 source여야 함을 알리고 `/beaver:analyze` 재실행 또는 config 수정(`integration: "dam"`)을 안내. (그대로 두면 ship이 mainline에 직접 발행하고 release가 mainline을 삭제한다.)
  - **로컬 dam 있으면** → 질문 없이 dam에서 stick 분기.
  - **로컬 dam 없으면** → **소스 브랜치를 묻는다**: 원격 추적 브랜치 목록 제시(기본 후보 = 감지된 mainline `main`/`master`). 선택한 브랜치(원격 있는)에서 dam 복제 생성(`git checkout -b <integration> origin/<src>`) → `.beaver/.dam-state.json`에 `{ "source": "<src>" }` 기록 → dam에서 stick 분기.
- stick: `<stick_prefix>/<domain>-<rand6>`(기본 `stick/...`) 생성·체크아웃 → state에 `{"<stick>": "dam"}` 기록.

도메인은 기능명/요청에서 추출. 생성한 브랜치를 한 줄로 알린다. dam은 로컬 전용 — 원격에 push하지 않는다(원격 반영은 `/beaver:release`).

## 3. 신규 모드
**spec** — `${CLAUDE_PLUGIN_ROOT}/templates/spec.md` 기반 `.beaver/output/spec/<domain>/<feature>-spec.md`.

작성 전 **기능명·도메인과 연관된 기존 코드를 스캔**: DB 스키마/엔티티/모델, 인접·유사 기능, 재사용 가능한 util/서비스, 기존 패턴. 이를 근거로 **제안** 생성 — "이런 것도 있으면 좋다 / 기존 `X`와 연계 필요 / 기존 `Y` 패턴 재사용 권장"을 근거(경로:라인)와 함께. (사용자는 기능명만 줘도 코드베이스에서 빠진 연계·고려사항을 짚어줌.)

spec 구성: 기능 설명 / API / 비즈니스 규칙 / 참고 + **제안(코드베이스 기반)** + **확정 설계 결정사항**(CLAUDE.md만으로 못 정하는 항목을 `- [ ]`로, 답 비움). → 사용자가 제안을 검토(수락/거부)하고 결정사항에 답한 뒤 plan 지시.

**plan** — 미답 있으면 중단. `${CLAUDE_PLUGIN_ROOT}/templates/plan.md` 기반 `.beaver/output/plan/<domain>/<feature>-plan.md`: 파일 목록 / 레이어별 설계 / 테스트 케이스 / 응답 코드 + **사전 구현 필요 항목**(인프라 부재 시 `- [ ]`, 모두 `[x]` 전엔 build 불가). 저장 시 validator 훅 자동 검증.

## 4. 변경 모드
`${CLAUDE_PLUGIN_ROOT}/templates/revision.md` 기반 `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. 원본 spec/plan은 참조만.

## 4.5 규약 영역 보강 (새 영역일 때만)
기획한 기능이 현 `docs/`·`CLAUDE.md`에 **없는 새 규약 영역**(예: websocket·payment·cache·실시간 등)을 도입하는지 §3 코드/패턴 스캔으로 판별한다.
- **기존 영역의 루틴 기능**(또 다른 CRUD 등)이면 묻지 않고 기존 규약을 따른다.
- **새 영역이면** plan 문서 확정 후 **"이 설계의 규약을 docs에 반영할까?"** 제안 — 무엇을 쓸지 미리보기(예: `docs/<topic>.md` 신규 + `CLAUDE.md` 섹션·체크리스트 링크). 승인 시 `analyze`와 **같은 doc 구조**로 작성, 생략 시 plan 문서에만 남긴다.
- 코드가 나오기 전 작성이므로 **draft 마커**를 단다 — 새 규약 섹션/문서 머리에 `<!-- beaver:draft 기획 기준 · ship 전 미확정 -->`. build가 코드 따라 갱신하고 ship §2가 검증·확정(마커 제거)한다.
- 편집은 현재 **stick 브랜치**에서 일어나 기능과 한 묶음으로 이동한다.

## 5. 보고
파일 경로 + "검토 후 `/beaver:build`" 안내.
