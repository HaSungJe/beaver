---
name: build
description: >-
  기획된 plan/revision 문서를 바탕으로 코드를 구현하고, 테스트를 작성·실행하고, 실패 시 자가수복하고,
  리포트를 남긴다. "작업 시작", "구현해줘", "build", "implement", "<기능명> 작업 시작" 같은 요청에 발동.
  신규/수정을 자동 판별하며, 인자 없이 호출하면 미구현 플랜을 자동 탐색한다. beaver의 3번째 단계.
---

# Beaver — Build (구현 + 테스트 + 자가수복 + 리포트)

기획 산출물(plan/revision)을 실제 코드로 구현하는 단계. 신규·수정을 한 skill로 처리하며, 구현 → 테스트 → 자가수복 → 리포트까지 잇는다. 모든 구현은 `CLAUDE.md` 규약을 따른다.

## 0. 모드·대상 결정

- **인자 있음**(`<기능명>`) — 해당 기능 디렉터리에서 미구현 플랜을 찾는다. **변경 우선** 검사(미추기 `revision-*.md`) → 없으면 신규(`plan.md` 있고 짝 `report.md` 없음).
- **인자 없음** — `.beaver/output/` 전체를 스캔해 미구현 플랜 후보 수집:
  - 신규 후보 — `plan/*/*-plan.md` 중 짝 `report.md` 없는 것
  - 변경 후보 — `revision/*/*-revision-*.md` 의 최신 회차가 `report.md` 에 미추기된 것
  - 0개 → 중단·안내 / 1개 → 한 줄 안내 후 진행 / 2개+ → 목록 제시 후 1건 선택받음(자동으로 N건 연달아 처리 금지).

## 1. 전제 조건 검증 (깨지면 구현 진입 금지)

모드별로 확인. 위반 시 무엇이 부족한지 안내 후 중단(강제 진행은 명시 승인 후에만):

**신규 모드**
1. `plan.md` 존재
2. spec의 "확정 설계 결정사항" 미답 없음
3. plan의 "사전 구현 필요 항목" 전부 `[x]`
4. plan validator 통과 (`node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>`)

**변경 모드**
1. 최신 `revision-*.md` 존재
2. 결정사항 미답 없음
3. 사전 구현 필요 항목 전부 `[x]`

## 2. 구현

- `.beaver/config.json` 의 `source_root`·경로 규약과 `CLAUDE.md` 규약을 따라 구현.
- plan/revision의 레이어별 설계를 코드로 옮긴다. 변경 모드는 "변경 후 스펙"만 반영하고 제거된 분기는 정리.

## 3. 테스트 + 자가수복

- `.beaver/config.json` 의 `commands.test_one` 으로 **해당 기능 테스트만** 먼저 실행(`$NAME` 치환).
- 실패 시 에러 분석 → 수정 → 재실행. **최대 `self_heal_retry_limit`회**(기본 10).
- 단위 통과 후 `commands.test` 로 **전체 회귀** 실행. 회귀 실패는 떠넘기지 않고 처리(모호하면 사용자 확인).
- 이 루프는 hook(`self-heal`)이 보조한다 — 구현/테스트 파일 저장 시 자동 발동.

> 테스트 강도: 상태코드·메시지만 보는 테스트 금지. 호출된 mock의 횟수·인자, 실패 지점 이후 미호출까지 검증해 "어디까지 실행되다 왜 멈췄는지" 추적 가능하게 작성(프로젝트 기존 테스트 스타일 = analyze가 정리한 testing 규약을 따른다).

## 4. 리포트

`${CLAUDE_PLUGIN_ROOT}/templates/report.md` 기반:
- **신규** — `.beaver/output/report/<domain>/<feature>-report.md` 신규 생성
- **변경** — 기존 report 끝에 `## 수정 - <YYMMDD>-<N>` 섹션 **추기**(원본 삭제·재작성 금지)

포함: 기능 요약 / 생성·수정·삭제 파일 / 테스트 결과 / 자가수복 이력 / 잔여 이슈.

## 5. 완료 보고

테스트 통과 여부를 사실대로 보고.

> **이 단계는 커밋하지 않는다.** build는 구현·테스트까지만 하고 변경분을 stick 브랜치에 쌓아둔다(작은 사이클). 다음 작업이 더 있으면 다시 `/beaver:plan` → `/beaver:build` 로 누적하고, 작업이 끝나면 `/beaver:ship` (또는 "커밋하고 푸쉬") 으로 한 번에 커밋·푸쉬·dam 병합한다.

## 관련
- 이전: [plan](../plan/SKILL.md) · 작업 누적 후 마감: [ship](../ship/SKILL.md)
