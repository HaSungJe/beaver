---
name: plan
description: 기능을 기획해 문서(spec → plan, 변경이면 revision)를 작성한다. "기능 계획", "기능 생성", "기능 수정", "<기능명> 기획", "plan a feature" 요청에 발동. 신규/변경 자동 판별. analyze가 만든 CLAUDE.md 규약이 있어야 동작.
---

# plan — 기능 기획 (spec → plan / revision)

## 0. 전제
- `CLAUDE.md` 필요. 없으면 중단하고 `/beaver:analyze` 안내.
- `.beaver/config.json`에서 경로·`branch` 설정을 읽는다.
- **memory 먼저 읽기**: `.beaver/memory/`(MEMORY.md + 관련 토픽)를 읽어 기획에 **최우선** 반영(memory > CLAUDE.md). 기획 중 사용자가 지속 규칙을 지적하면 확인 후 저장 — 프로토콜 `${CLAUDE_PLUGIN_ROOT}/templates/memory-protocol.md`.
- **워크트리 설정 보장**: `.claude/settings.json`에 `worktree.baseRef`가 `"head"`인지 확인하고, 없거나 다르면 `"head"`로 설정(merge-patch, 다른 키 보존). 이래야 EnterWorktree가 현재 체크아웃 HEAD에서 stick을 분기한다(기본값 `fresh`는 origin/기본브랜치라 develop 등 누락).

## 1. 모드 판별
대상 기능명으로:
- 같은 기능의 `plan.md` + `report.md` 존재(구현 완료) → **변경 모드**(revision).
- 그 외 → **신규 모드**(spec → plan).
애매하면 사용자 확인.

## 2. 워크트리 진입 (stick 격리)
plan 시작 시 stick을 `.claude/worktrees/`에 격리하고 세션을 그리로 옮긴다 — 현재 작업 디렉터리는 그대로 둔다(병렬 세션 가능).

- **이미 stick worktree 안이면**(현재 cwd가 `.claude/worktrees/<stick>` 이고 state에 키 존재) → 그대로 누적(새로 안 만듦).
- 아니면:
  1. `origin_branch = git branch --show-current` — ship이 되돌릴 대상. 빈값(detached)이면 중단하고 브랜치 체크아웃 안내.
  2. stick 이름 = `<stick_prefix>/<domain>-<rand6>` (기본 `stick/...`). 도메인은 기능명/요청에서 추출.
  3. `EnterWorktree(name=<stick>)` 호출 → CC가 `.claude/worktrees/<stick>` 생성 + 세션 cwd 전환(base=현재 HEAD, §0의 baseRef=head).
  4. `.beaver/.auto-branch-state.json`에 `{ "<stick>": "<origin_branch>" }` 기록.

생성한 worktree·stick·origin_branch를 한 줄로 알린다. stick·worktree 모두 로컬 전용 — 원격 push는 ship에서만.

## 3. 신규 모드
**spec** — `${CLAUDE_PLUGIN_ROOT}/templates/spec.md` 기반 `.beaver/output/spec/<domain>/<feature>-spec.md`.

작성 전 **코드베이스를 병렬 심층분석**한다 — 속도 위해 fan-out(오케스트레이션: `Workflow→병렬 / Task→분산 / 순차`, 병렬 우선). 에이전트 `${CLAUDE_PLUGIN_ROOT}/agents/`:
- architecture-mapper — 인접 서브시스템 구조
- convention-scout — 해당 도메인 규약
- test-pattern-analyzer — 테스트 규약
- (재사용/인접 스캔) — 유사 기능·재사용 util/서비스·DB 스키마/엔티티

분석 결과로 **판별**: 이 기능이 ① **기존 패턴에 추가**(또 다른 CRUD 등)인지 ② **신규(net-new) 기능**(현 코드/규약에 없는 특수 영역)인지. 신규 특수기능이면 **구현 기술검토 + 제안**(필요 라이브러리/접근/대안)을 분석에 포함한다.

이를 근거로 **제안** 생성 — "기존 `X` 연계 필요 / 기존 `Y` 패턴 재사용 / 설계 접근 2-3안(tradeoff·권장)"을 근거(경로:라인)와 함께.

**대화형 확정(1문1답)** — spec을 빈칸 채우기로 던지지 않고, 분석 근거로 **한 번에 하나씩** 묻는다: 설계 접근안(2-3 + 권장) 선택, CLAUDE.md만으로 못 정하는 결정사항. 사용자 답을 수집한다.

**spec 자동생성** — 대화로 확정되면 `${CLAUDE_PLUGIN_ROOT}/templates/spec.md` 기반 `.beaver/output/spec/<domain>/<feature>-spec.md`를 **자동 작성**(기능 설명 / API / 비즈규칙 / 참고 + 코드근거 제안 + **확정된 결정사항과 그 근거**). 미답 결정사항이 없어야 plan 단계로 진행.

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
