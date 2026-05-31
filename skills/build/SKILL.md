---
name: build
description: 기획된 plan/revision을 구현하고 테스트·자가수복·리포트까지 수행한다. "작업 시작", "구현", "build", "<기능명> 작업 시작" 요청에 발동. 신규/수정 자동 판별, 인자 없으면 미구현 플랜 자동 탐색.
---

# build — 구현 + 테스트 + 자가수복 + 리포트

build는 **커밋하지 않는다** — 구현·테스트만 하고 stick 브랜치에 누적. 배포는 `/beaver:ship`.

## 0. 모드·대상
- 인자 있음(`<기능명>`): 변경 우선(미추기 `revision-*.md`) → 없으면 신규(`plan.md` 있고 `report.md` 없음).
- 인자 없음: `.beaver/output/` 스캔 — 신규(`plan/*/*-plan.md` 짝 report 없음) / 변경(`revision/*` 최신 회차 미추기). 0개 중단 / 1개 진행 / 2개+ 선택(자동 N건 금지).

## 1. 전제 검증 (깨지면 진입 금지, 안내 후 중단)
- **신규**: `plan.md` 존재 / spec 결정사항 미답 없음 / 사전 구현 항목 전부 `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` 통과.
- **변경**: 최신 `revision-*.md` 존재 / 결정사항 미답 없음 / 사전 구현 항목 `[x]`.

## 2. 구현
`config.json` 경로 + `CLAUDE.md` 규약대로 plan/revision 설계를 코드로. 변경 모드는 "변경 후 스펙"만 반영, 제거 분기 정리.

## 3. 테스트 + 자가수복
- `commands.test_one`(`$NAME` 치환)으로 해당 기능 테스트 → 실패 시 수정·재실행(최대 `self_heal_retry_limit`, 기본 10).
- 단위 통과 후 `commands.test` 전체 회귀 — 실패는 처리(모호하면 확인).
- `self-heal` 훅이 구현/테스트 파일 저장 시 자동 보조.
- 테스트 강도는 CLAUDE.md testing 규약(상태코드만 검증 금지).

## 4. 리포트
`templates/report.md` 기반:
- 신규 → `.beaver/output/report/<domain>/<feature>-report.md` 생성.
- 변경 → 기존 report 끝에 `## 수정 - <YYMMDD>-<N>` 추기.

## 5. 보고
결과 사실대로. 작업 더 있으면 `/beaver:plan`→`build` 누적, 끝이면 `/beaver:ship`.
