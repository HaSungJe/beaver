---
name: plan
description: >-
  기능을 기획해 문서(spec → plan, 또는 변경이면 revision)를 작성한다. "기능 계획", "기능 생성",
  "기능 수정", "<기능명> 기획해줘", "plan a feature", "spec out" 같은 요청에 발동. 신규/변경을 자동
  판별한다. CLAUDE.md 규약을 근거로 설계 결정사항을 질문으로 정리하고, 답변이 채워지면 plan을 작성한다.
  beaver의 2번째 단계 — analyze로 만든 규약 문서가 있어야 일관성 있게 동작.
---

# Beaver — Plan (기능 기획: spec → plan / revision)

기능을 **구현 전에** spec으로 정리하는 단계. 신규 기획과 변경 기획을 한 skill로 처리하며, 모드는 파일 상태로 자동 판별한다. 모든 설계 판단은 루트 `CLAUDE.md` 규약을 근거로 한다.

## 0. 전제

- 루트 `CLAUDE.md` 가 있어야 한다. 없으면 중단하고 `/beaver:analyze` (코드베이스 분석) 를 먼저 안내한다.
- `.beaver/config.json` 에서 `source_root` 등 경로 규약을 읽는다.

## 1. 모드 자동 판별

대상 기능명(`$ARGUMENTS` 또는 사용자 발화에서 추출)으로:

- **변경 모드** — 같은 기능의 `plan.md` + `report.md` 가 이미 존재(=구현 완료된 기능) → 변경 기획. `revision-<YYMMDD>-<N>.md` 작성.
- **신규 모드** — 그 외 → 신규 기획. `spec.md` → `plan.md` 작성.

판단이 애매하면 사용자에게 신규/변경을 한 줄로 확인한다.

## 2. 브랜치 자동화 (선택)

기획 시작 직전, 새 작업 브랜치(stick)를 만들지 결정한다. 여기서 정한 **base가 나중에 `/beaver:ship` 의 병합 대상**이 된다(보통 통합 브랜치 `dam` = `.beaver/config.json` 의 `branch.integration`).

- **사전 검사** — 현재 브랜치가 `.beaver/.auto-branch-state.json` 의 키로 이미 등록돼 있으면(= beaver가 만든 stick 브랜치) **질의 생략**, 그대로 진행(같은 stick 브랜치에 plan→build 작업을 여러 개 누적 = 작은 사이클 반복).
- **질의** — 아니면 "이 기능용 새 작업 브랜치(stick)를 만들까요? (예/아니오)" 물어본다.
  - 예 → base = `branch.integration`(기본 `dam`). **로컬에 base가 없으면 생성한다**([ship](../ship/SKILL.md) 의 "base 브랜치 보장" 규칙과 동일: 원격에 있으면 추적 브랜치로, 없으면 메인라인에서 새로 만들고 알림). 그 base에서 `stick/<domain>-<랜덤6>` 생성·체크아웃(접두사는 `branch.stick_prefix`, 기본 `stick`) → `.beaver/.auto-branch-state.json` 에 `{"<stick>": "<base>"}` 기록. ship 시 이 base로 병합. (다른 base를 원하면 사용자에게 확인.)
  - 아니오 → 현재 브랜치에서 진행.

## 3. 신규 모드 — spec → plan

### spec 작성
`${CLAUDE_PLUGIN_ROOT}/templates/spec.md` 기반으로 `.beaver/output/spec/<domain>/<feature>-spec.md` 초안 작성:
- 기능 설명 / API spec / 비즈니스 규칙 / 참고사항
- **확정 설계 결정사항** — `CLAUDE.md` 규약만으로 판단할 수 없는 항목을 `- [ ]` 체크리스트로 나열(답은 비워둠). 어떤 걸 물을지는 CLAUDE.md에서 "Y/N 선택" 또는 "값 선택"이 필요한 규칙을 스스로 식별.

→ 사용자가 spec을 보완하고 결정사항에 답한 뒤 plan 작성을 지시한다.

### plan 작성
미답 결정사항이 하나라도 있으면 **중단·재질의**. 모두 답해졌으면 `${CLAUDE_PLUGIN_ROOT}/templates/plan.md` 기반으로 `.beaver/output/plan/<domain>/<feature>-plan.md` 작성:
- 파일 목록 / 레이어별 설계 / 테스트 케이스 / 응답 코드
- **사전 구현 필요 항목** — CLAUDE.md 규칙이 요구하는 인프라가 `source_root`에 없으면 `- [ ]` 체크리스트로 flag. 모두 `[x]` 되기 전엔 build 진입 불가.

plan 저장 시 validator 훅이 자동으로 구조를 검증한다.

## 4. 변경 모드 — revision

`${CLAUDE_PLUGIN_ROOT}/templates/revision.md` 기반으로 `.beaver/output/revision/<domain>/<feature>-revision-<YYMMDD>-<N>.md` 작성:
- 변경요청 사유 / 변경 전·후 스펙 / 영향받는 파일 / 확정 설계 결정사항(있으면)
- 원본 `spec.md`·`plan.md` 는 수정하지 않고 참조만.

## 5. 완료 보고

작성한 파일 경로 + 다음 단계 안내: "검토 후 `/beaver:build` (또는 '작업 시작') 으로 구현하세요."

## 관련
- 이전: [analyze](../analyze/SKILL.md) · 다음: [build](../build/SKILL.md)
- 템플릿: `${CLAUDE_PLUGIN_ROOT}/templates/`
