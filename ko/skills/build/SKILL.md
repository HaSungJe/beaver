---
name: build
description: 기획된 plan/revision을 구현(테스트 파일 작성 후 구현)하고 리포트까지 수행한다. "작업 시작", "구현", "build", "<기능명> 작업 시작" 요청에 발동. 신규/수정 자동 판별, 인자 없으면 미구현 플랜 자동 탐색. 테스트는 여기서 작성하되 실행은 ship에서만.
---

# build — 테스트 작성 → 구현 → 리포트

build는 **커밋하지 않는다** — 테스트를 작성하고 구현해 stick 브랜치(fast 직접 모드면 현재 브랜치)에 누적한다. 배포는 `/beaver:ship`.

## 0. stick 워크트리 보장 → memory 우선 + 모드·대상

**어떤 읽기·쓰기보다 먼저 작업 위치 확정** — build는 plan(또는 fast)이 문서를 둔 곳에 누적한다, 틀린 쪽 금지(안 그러면 새 세션이 report를 메인에 흘린다):
- **stick worktree 안이면**(cwd가 `.claude/worktrees/<stick>` + `.beaver/.auto-branch-state.json`에 키) → 진행(워크트리 모드).
- **아니면, 직접 모드(fast) 먼저 확인**: 메인 체크아웃의 `.beaver/output/`에 대상의 미구현 plan/revision이 있으면(`/beaver:fast`가 생성) 현재 브랜치 **그 자리에서** 작업 — 미커밋 누적; ship이 바로 커밋 + 푸쉬. `git branch --show-current` 비어 있으면 안 됨(detached → 중단).
- **그래도 아니면** → 메인을 더 스캔하지 말 것. `.claude/worktrees/` 아래에서 대상의 미구현 plan/revision을 담은 stick 워크트리를 찾는다(기능명 매칭, stick 이름이 도메인 보유). 정확히 1개 → `EnterWorktree(name=<stick>)` 재진입; 0개나 2개+ → 중단하고 `/beaver:plan`(또는 `/beaver:fast`) 먼저 돌리거나 대상 명시 안내.
- 같은 기능의 plan이 메인과 stick **양쪽에** 있으면 중단하고 어느 쪽인지 묻는다.

**memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 구현 내내 **최우선** 적용(memory > CLAUDE.md > 기본). 사용자가 지속 규칙을 지적하면 확인 후 저장하고 즉시 적용 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. CLAUDE.md 규약과 충돌/보강이면 CLAUDE.md 반영도 제안(어느 쪽이든 memory 우선 적용).

### 모드·대상
> **미반영 revision** = report에 아직 회차가 없는 `revision-*.md`(= 구현 안 된 변경).
- 인자 있음(`<기능명>`): 변경 우선(미반영 `*-revision-*.md` 있으면) → 없으면 신규(`*-plan.md` 있고 짝 `*-report.md` 없음).
- 인자 없음: `.beaver/output/` 스캔 — 후보 0개 중단, 1개 진행, 2개+ 사용자 선택(여러 건 자동 구현 금지).

## 1. 전제 검증 (깨지면 진입 금지, 안내 후 중단)
- **신규**: `plan.md` 존재 / spec 결정사항 미답 없음 / 사전 구현 항목 전부 `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` 통과.
- **변경**: 최신 `revision-*.md` 존재 / 결정사항 미답 없음 / 사전 구현 항목 `[x]`.

## 1.5 준비 (작업 크기에 맞춘 fan-out)
작은/루틴 변경 → 인라인(서브에이전트 부팅비가 이득을 잡아먹음); 큰/다중 파일 → 병렬 fan-out(Workflow 병렬 / Task 분산 / 불가 시 순차)하되 각 에이전트의 읽기 범위는 plan의 파일 목록 — 코드베이스 전체 금지. 단계:
- plan/revision 분석(파일목록·레이어/유닛·테스트케이스)
- 건드릴 기존 코드 매핑(경로:라인)
- 테스트 케이스 구체화(CLAUDE.md testing 강도)
- 재사용 유닛 파악 — 이 프로젝트가 **실제로** 재사용하는 유닛을 코드 근거(경로:라인)로, 프로젝트가 쓰는 이름 그대로.

산출은 §2~3의 입력. **준비는 병렬, 구현(§2~3)은 순차.**

## 2. 테스트 작성
plan/revision의 테스트 케이스를 **실제 테스트 코드로**, CLAUDE.md testing 규약 강도로 작성한다 — 결과 계약만이 아니라 실제 동작을 단언하고, 이 프로젝트가 실제로 쓰는 도구·패턴으로 진입점을 exercise한다. **build에서는 테스트를 실행하지 않는다** — 실행은 ship 후 `/beaver:test`; 워크트리엔 의존성이 없어 build 중 실행은 거짓 실패를 낸다.

**data-access 스모크 spec 동반 필수**: 매핑 민감 쿼리 구문(정의: docs/testing.md "Data-Access 스모크")을 쓰는 data-access 메서드를 신규/수정하면 같은 패스에서 스모크 spec을 작성한다 — 메서드의 실제 조건이 예외 없이 쿼리로 빌드되어야 하고, 새 매핑 민감 필드가 생겼으면 위험 매핑 스냅샷도 갱신한다. **그런 메서드의 mock-only 커버 금지** — 쿼리 매핑 코드를 0줄 실행하므로 그 버그 클래스가 구조적으로 통과한다.

## 3. 구현
`config.json` 경로 + `CLAUDE.md` 규약대로 구현해 작성한 테스트를 충족시킨다. 변경 모드: "변경 후 스펙"만 반영, 제거 분기 정리. plan/revision이 불필요로 표시한 코드(plan §1.7)도 함께 삭제한다 — 추가는 그로 인한 삭제와 한 묶음.
- **build는 테스트를 돌리지 않는다** — 모든 실행은 ship 후 `/beaver:test`, 실제 체크아웃에서.
- **draft 규약 동기화**: plan §4.5의 draft 문서(`beaver:draft` 마커)가 있고 구현이 설계와 틀어지면 문서를 실제 코드에 맞게 갱신한다; 마커는 유지(확정은 ship).

### 막힘 fallback (구현 중 plan이 틀렸다고 판명될 때)
억지로 밀어붙이지 말고 기획으로 되먹인다:
1. **근본원인 격리** — 가설(설계 불일치·인프라 부재·접근 오류)을 세워 검증.
2. **plan으로 복귀** — 해결 접근을 제안하거나 사용자에게 제안받는다.
3. **plan/revision 갱신** — 합의된 접근으로 미배포 plan 수정(또는 새 revision).
4. **build 재진입** — 갱신된 계획으로 §2부터.

## 4. 리포트
`${CLAUDE_PLUGIN_ROOT}/templates/report.md` 기반:
- 신규 → `.beaver/output/report/<domain>/<feature>-report.md` 생성.
- 변경 → 기존 report 끝에 `## 수정 - <YYMMDD>-<N>` 추가.

## 5. 보고
**완료 전 검증**: build는 테스트를 돌리지 않으므로 읽기·추론으로 plan/spec 의도 일치를 확인한다(누락·오구현; 가능하면 가벼운 수동 exercise). 권위 있는 실행은 ship 후 `/beaver:test`. 결과를 사실대로 보고. 작업 더 있으면 `/beaver:plan`→`build`, 끝이면 `/beaver:ship`.
