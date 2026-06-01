---
name: build
description: 기획된 plan/revision을 테스트 먼저(TDD)로 구현하고 자가수복·리포트까지 수행한다. "작업 시작", "구현", "build", "<기능명> 작업 시작" 요청에 발동. 신규/수정 자동 판별, 인자 없으면 미구현 플랜 자동 탐색.
---

# build — 테스트 먼저(TDD) → 구현 → 자가수복 → 리포트

build는 **커밋하지 않는다** — 구현·테스트만 하고 stick 브랜치에 누적. 배포는 `/beaver:ship`.

## 0. memory 우선 + 모드·대상
**memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 구현 내내 **최우선** 적용(memory > CLAUDE.md > 기본). 구현 중 사용자가 지속 규칙을 지적하면(예: "service 말고 repository에서만 UK/FK 핸들링") **확인 후 저장**하고 즉시 적용 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. CLAUDE.md 규약과 충돌/보강이면 CLAUDE.md 반영도 제안(즉시 수정 X, memory 우선 적용만).

### 모드·대상
- 인자 있음(`<기능명>`): 변경 우선(미추기 `revision-*.md`) → 없으면 신규(`plan.md` 있고 `report.md` 없음).
- 인자 없음: `.beaver/output/` 스캔 — 신규(`plan/*/*-plan.md` 짝 report 없음) / 변경(`revision/*` 최신 회차 미추기). 0개 중단 / 1개 진행 / 2개+ 선택(자동 N건 금지).

## 1. 전제 검증 (깨지면 진입 금지, 안내 후 중단)
- **신규**: `plan.md` 존재 / spec 결정사항 미답 없음 / 사전 구현 항목 전부 `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` 통과.
- **변경**: 최신 `revision-*.md` 존재 / 결정사항 미답 없음 / 사전 구현 항목 `[x]`.

## 2. 테스트 먼저 (red)
plan/revision의 "테스트 케이스"를 **실제 테스트 코드로 먼저** 작성 — CLAUDE.md testing 규약 강도로(상태코드만 검증 금지). `commands.test_one`(`$NAME` 치환) 실행해 **의도대로 실패(red)** 하는지 확인(아직 구현 없음 → 실패가 정상). 컴파일이 막히면 시그니처/stub만 두어 red 상태를 확보. *테스트 저장 시 `self-heal` 훅이 자동 실행 — 첫 red는 정상이며, 이어서 구현으로 green을 만든다.*

## 3. 구현 → green
`config.json` 경로 + `CLAUDE.md` 규약대로 plan/revision 설계를 구현해 테스트를 통과시킨다. 변경 모드는 "변경 후 스펙"만 반영, 제거 분기 정리.
- 실패 시 분석·수정·재실행(최대 `self_heal_retry_limit`, 기본 5). `self-heal` 훅이 구현 파일 저장 시 자동 보조.
- **이 작업에서 만든 테스트(`test_one`)만 확인한다.** 기존 테스트 전체 회귀는 build에서 돌리지 않음 — 원격에 반영되는 `/beaver:release` 직전에 1회 수행한다(stick에 여러 기능을 누적하므로 build마다 전체를 돌리는 낭비를 피함).
- **draft 규약 동기화**: plan §4.5가 만든 draft 규약 문서(`beaver:draft` 마커)가 있고 구현이 설계와 틀어지면(self-heal·접근 변경 등) **그 문서를 실제 코드에 맞게 갱신**한다. 마커는 유지(확정은 ship). 코드↔규약 draft 항상 일치.

### 막힘 fallback (self-heal 한도 소진 시)
self-heal이 같은 실패로 한도(기본 5회)를 소진하면 **build를 성공으로 끝내지 않고** 추측 수정을 멈춘다:
1. **근본원인 격리** — 가설(mock·호출 순서·비동기·설계 불일치 등)을 세워 하나씩 검증해 진짜 원인 특정.
2. **plan으로 복귀** — 원인을 근거로 해결 접근을 제안하거나 사용자에게 제안받는다.
3. **plan/revision 갱신** — 합의된 접근으로 미배포 plan을 직접 수정(또는 새 revision).
4. **build 재진입** — 갱신된 계획으로 §2부터 다시.

전제: 구현이 막히면 계획·접근이 틀렸을 수 있다 — 막힘을 사람 호출로 끝내지 않고 기획으로 되먹인다.

## 4. 리포트
`templates/report.md` 기반:
- 신규 → `.beaver/output/report/<domain>/<feature>-report.md` 생성.
- 변경 → 기존 report 끝에 `## 수정 - <YYMMDD>-<N>` 추기.

## 5. 보고
**완료 전 검증**: 테스트 통과만이 아니라 plan/spec 의도대로 동작하는지 확인(누락·오구현 점검, 가능하면 실제 실행/호출). 그 뒤 결과를 사실대로 보고. 작업 더 있으면 `/beaver:plan`→`build` 누적, 끝이면 `/beaver:ship`.
