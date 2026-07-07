---
name: build
description: 기획된 plan/revision을 구현(테스트 파일 작성 후 구현)하고 리포트까지 수행한다. "작업 시작", "구현", "build", "<기능명> 작업 시작" 요청에 발동. 신규/수정 자동 판별, 인자 없으면 미구현 플랜 자동 탐색. 테스트는 여기서 작성하되 실행은 ship에서만.
---

# build — 테스트 작성 → 구현 → 리포트

build는 **커밋하지 않는다** — 구현만 하고 stick 브랜치에 누적. 배포는 `/beaver:ship`.

## 0. stick 워크트리 보장 → memory 우선 + 모드·대상

**stick 워크트리 안인지 보장(어떤 읽기·쓰기보다 먼저)**: build는 stick 브랜치에 누적하므로 반드시 stick 워크트리 **안에서** 돌아야 한다 — 메인 레포 금지. `.beaver/output/` 스캔이나 report 쓰기 전에 먼저 확인한다(안 그러면 새 세션이 report를 메인에 흘린다).
- **이미 stick worktree 안이면**(cwd가 `.claude/worktrees/<stick>` 이고 `.beaver/.auto-branch-state.json`에 키 존재) → 진행.
- **아니면**(새 세션, cwd가 메인) → 메인을 스캔하지 **말 것**. `.claude/worktrees/` 아래에서 대상 기능의 미구현 plan/revision을 담은 stick 워크트리를 찾는다(기능명으로 매칭, stick 이름이 도메인 보유). 정확히 1개면 `EnterWorktree(name=<stick>)`로 재진입, 0개거나 2개+면 중단하고 `/beaver:plan` 먼저 돌리거나 대상을 명시하라고 안내.

**memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 구현 내내 **최우선** 적용(memory > CLAUDE.md > 기본). 구현 중 사용자가 지속 규칙을 지적하면(이 프로젝트 고유 구조에서 어떤 책임이 어디에 속하는지에 대한 제약) **확인 후 저장**하고 즉시 적용 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`. CLAUDE.md 규약과 충돌/보강이면 CLAUDE.md 반영도 제안(즉시 수정 X, memory 우선 적용만).

### 모드·대상
> **미반영 revision** = report에 아직 회차가 추가되지 않은 `revision-*.md`(= 구현 안 된 변경).
- 인자 있음(`<기능명>`): 변경 우선(미반영 `*-revision-*.md` 있으면) → 없으면 신규(`*-plan.md` 있고 짝 `*-report.md` 없음).
- 인자 없음: `.beaver/output/` 스캔 — 신규(`plan/*/*-plan.md` 짝 report 없음) / 변경(`revision/*` 최신 회차 미반영). 후보 0개면 중단, 1개면 진행, 2개+면 사용자가 하나 선택(여러 건 한 번에 자동 구현 금지).

## 1. 전제 검증 (깨지면 진입 금지, 안내 후 중단)
- **신규**: `plan.md` 존재 / spec 결정사항 미답 없음 / 사전 구현 항목 전부 `[x]` / `node ${CLAUDE_PLUGIN_ROOT}/scripts/validate-plan.js <path>` 통과.
- **변경**: 최신 `revision-*.md` 존재 / 결정사항 미답 없음 / 사전 구현 항목 `[x]`.

## 1.5 준비 (작업 크기에 맞춘 fan-out)
구현 전 준비 작업만. **fan-out 크기를 정한다**: 작은/루틴 변경은 인라인으로(서브에이전트 부팅비가 이득을 잡아먹음), 큰/다중 파일 변경은 fan-out(병렬 우선: Workflow 병렬 / Task 분산 / 불가 시 순차)하되 **각 에이전트에 plan의 파일 목록을 읽기 범위로** 주고 코드베이스 전체는 금지. 단계:
- plan/revision 분석(파일목록·레이어/유닛·테스트케이스 정독)
- 건드릴 기존 코드 매핑(경로:라인)
- 테스트 케이스 구체화(CLAUDE.md testing 강도)
- 재사용 가능한 유닛 파악 — 이 프로젝트가 **실제로** 재사용하는 유닛을 코드 근거(경로:라인)로 도출해 프로젝트가 쓰는 이름 그대로 가리킨다.

산출은 §2(테스트 작성)·§3(구현)의 입력으로 쓴다. **준비는 병렬, 구현(§2~3)은 순차**(구현은 병렬화하지 않는다).

## 2. 테스트 작성
plan/revision의 "테스트 케이스"를 **실제 테스트 코드로** 작성 — CLAUDE.md testing 규약 강도로(결과/계약만 검증 금지 — 실제 동작을 단언). 이 프로젝트가 **실제로** 쓰는 테스트 도구·패턴으로 진입점을 충분한 강도로 exercise한다(코드 근거와 CLAUDE.md testing 규약에서 도출, 특정 포지션 테스트 구문을 가정하지 않는다). **build에서는 테스트를 실행하지 않는다** — 실행은 `/beaver:test`(독립 전체회귀, ship 후 원래 브랜치에서)로 미룬다. 의도된 설계다: 워크트리엔 의존성 디렉터리가 없어, build 도중 불완전한 환경에서 테스트를 돌리면 거짓 실패가 난다.

**data-access 스모크 spec 동반 작성 필수**(docs/testing.md "Data-Access 스모크" 기준): 매핑 민감 쿼리 구문(정의는 그 문서 — 매핑된 필드명이 저장소 컬럼과 다른 필드 조건, 또는 동적으로 조립되는 쿼리)을 쓰는 data-access 메서드를 신규/수정하면 같은 패스에서 스모크 spec 을 작성한다 — 그 메서드의 실제 조건이 예외 없이 쿼리로 빌드되어야 하고(스택이 지원하면 무연결 metadata/쿼리 빌드), 새 매핑 민감 필드가 생겼으면 위험 매핑 스냅샷도 갱신한다. **그런 메서드를 data-access mock spec 만으로 커버하는 것 금지** — mock-only spec 은 쿼리 매핑 코드를 0줄 실행하므로 이 클래스의 버그가 구조적으로 통과한다.

## 3. 구현
`config.json` 경로 + `CLAUDE.md` 규약대로 plan/revision 설계를 구현해, 작성한 테스트 케이스를 충족시킨다. 변경 모드는 "변경 후 스펙"만 반영, 제거 분기 정리.
- **build는 테스트를 돌리지 않는다.** 신규 기능 테스트도, 전체 회귀도 모두 `/beaver:test`에서 — ship 후 원래 브랜치(개발자 의존성 갖춘 실제 체크아웃)에서 실행한다. 모듈 해석이 불안정한 워크트리에서 테스트 돌리는 것을 피한다.
- **draft 규약 동기화**: plan §4.5가 만든 draft 규약 문서(`beaver:draft` 마커)가 있고 구현이 설계와 틀어지면(접근 변경 등) **그 문서를 실제 코드에 맞게 갱신**한다. 마커는 유지(확정은 ship). 코드↔규약 draft 항상 일치.

### 막힘 fallback (구현 중 plan이 틀렸다고 판명될 때)
구현하다가 (국소 코드 실수가 아니라) 계획·접근 자체가 틀렸음을 발견하면 **억지로 밀어붙이지 말고** 기획으로 되먹인다:
1. **근본원인 격리** — 가설(설계 불일치·인프라 부재·접근 오류 등)을 세워 검증해 진짜 원인 특정.
2. **plan으로 복귀** — 원인을 근거로 해결 접근을 제안하거나 사용자에게 제안받는다.
3. **plan/revision 갱신** — 합의된 접근으로 미배포 plan을 직접 수정(또는 새 revision).
4. **build 재진입** — 갱신된 계획으로 §2부터 다시.

## 4. 리포트
`${CLAUDE_PLUGIN_ROOT}/templates/report.md` 기반:
- 신규 → `.beaver/output/report/<domain>/<feature>-report.md` 생성.
- 변경 → 기존 report 끝에 `## 수정 - <YYMMDD>-<N>` 추가.

## 5. 보고
**완료 전 검증**: build는 테스트를 돌리지 않으므로, 읽기·추론으로 plan/spec 의도대로 동작하는지 확인한다(누락·오구현 점검, 프로젝트가 지원하면 가벼운 수동 exercise). 권위 있는 테스트 실행은 ship 후 `/beaver:test`다. 그 뒤 결과를 사실대로 보고. 작업 더 있으면 `/beaver:plan`→`build` 누적, 끝이면 `/beaver:ship`.
