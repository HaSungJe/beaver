---
name: plan
description: 기능을 기획해 문서(spec → plan, 변경이면 revision)를 작성한다. "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature" 요청에 발동. 신규/변경 자동 판별. analyze가 만든 CLAUDE.md 규약이 있어야 동작.
---

# plan — 기능 기획 (spec → plan / revision)

## 0. 전제
- `CLAUDE.md` 필요. 없으면 중단하고 `/beaver:analyze` 안내.
- `.beaver/config.json`에서 경로·`branch` 설정을 읽는다.

## 1. 모드 판별
대상 기능명으로:
- 같은 기능의 `plan.md` + `report.md` 존재(구현 완료) → **변경 모드**(revision).
- 그 외 → **신규 모드**(spec → plan).
애매하면 사용자 확인.

## 2. 브랜치 (자동)
plan 시작 시 작업 브랜치(stick)를 **질문 없이 항상 자동 생성**한다:
- 현재 브랜치가 이미 `.beaver/.auto-branch-state.json` 키(= beaver stick)면 → 그대로 누적(새로 안 만듦).
- 아니면 → base = `branch.integration`(기본 `dam`. 로컬에 없으면 생성: 원격 `origin/<base>` 있으면 추적, 없으면 메인라인에서 만들고 알림)에서 `<stick_prefix>/<domain>-<rand6>`(기본 `stick/...`) 생성·체크아웃 → state에 `{"<stick>": "<base>"}` 기록.

도메인은 기능명/요청에서 추출. 생성한 브랜치를 한 줄로 알린다.

## 3. 신규 모드
**spec** — `templates/spec.md` 기반 `.beaver/output/spec/<domain>/<feature>-spec.md`.

작성 전 **기능명·도메인과 연관된 기존 코드를 스캔**: DB 스키마/엔티티/모델, 인접·유사 기능, 재사용 가능한 util/서비스, 기존 패턴. 이를 근거로 **제안** 생성 — "이런 것도 있으면 좋다 / 기존 `X`와 연계 필요 / 기존 `Y` 패턴 재사용 권장"을 근거(경로:라인)와 함께. (사용자는 기능명만 줘도 코드베이스에서 빠진 연계·고려사항을 짚어줌.)

spec 구성: 기능 설명 / API / 비즈니스 규칙 / 참고 + **제안(코드베이스 기반)** + **확정 설계 결정사항**(CLAUDE.md만으로 못 정하는 항목을 `- [ ]`로, 답 비움). → 사용자가 제안을 검토(수락/거부)하고 결정사항에 답한 뒤 plan 지시.

**plan** — 미답 있으면 중단. `templates/plan.md` 기반 `.beaver/output/plan/<domain>/<feature>-plan.md`: 파일 목록 / 레이어별 설계 / 테스트 케이스 / 응답 코드 + **사전 구현 필요 항목**(인프라 부재 시 `- [ ]`, 모두 `[x]` 전엔 build 불가). 저장 시 validator 훅 자동 검증.

## 4. 변경 모드
`templates/revision.md` 기반 `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md`. 원본 spec/plan은 참조만.

## 5. 보고
파일 경로 + "검토 후 `/beaver:build`" 안내.
