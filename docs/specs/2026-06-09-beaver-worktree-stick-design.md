# beaver worktree-stick 모델 재설계

- 날짜: 2026-06-09
- 상태: 설계 승인 대기 (검토 게이트)
- 범위: `plan` / `build` / `ship` 재작성, `release`·`resolve` 삭제, `analyze`·config·state 갱신

## 1. 배경 / 목적

현재 beaver는 `source(remote) → dam(local) → stick → ship(stick→dam) → release(dam→source)` 의 4계층 브랜치 모델이다. stick 작업 시 **현재 작업 디렉터리를 stick으로 체크아웃**하므로, 여러 세션으로 **병렬 작업**할 때 같은 워킹트리/브랜치를 두고 충돌해 번거롭다.

목적:
1. **병렬 세션** — 세션마다 격리된 워크트리에서 독립 작업.
2. **dam 계층 제거** — stick을 원래 작업하던 브랜치(main/develop 등)에 직접 병합. 모델 단순화.
3. **항상 코드베이스 기준** — plan이 코드베이스를 심층(병렬) 분석하고 그 근거로 기능을 설계.
4. **속도** — plan 분석·build 준비를 병렬화.

## 2. 모델 비교

```
[기존]
source(remote) → dam(local clone, plan 생성)
  → stick/*(dam 분기) → ship(stick→dam) → release(dam→source + dam 삭제)
  · 작업 시 현재 디렉터리를 stick으로 체크아웃

[신규]
현재 브랜치(main/develop/임의)
  → plan:  현재 HEAD에서 stick 분기 + .claude/worktrees/<stick> 격리 + 세션 진입
  → build: worktree 안에서 TDD 구현
  → ship:  전체회귀 → 원래 브랜치 복귀 → stick 전진병합 → push → worktree 파기
  · dam / release / resolve 없음
```

각 stick = 1 worktree = 1 세션 → 서로 다른 디렉터리 → 병렬 충돌 0.

## 3. 워크트리 메커니즘 (CC 네이티브 위임)

CC 내장 `EnterWorktree` / `ExitWorktree` 툴에 위임한다. 이 툴들이 **세션 cwd를 실제로 전환**한다.

- `EnterWorktree(name=<stick>)` → `.claude/worktrees/<stick>` 생성 + 세션 cwd를 그리로 전환. base는 `worktree.baseRef` 설정을 따른다.
- `worktree.baseRef` 기본값은 `fresh`(= `origin/<기본브랜치>`). 우리는 **현재 체크아웃 HEAD에서 분기**해야 하므로 `head`가 필요하다. → beaver가 `.claude/settings.json`에 `worktree.baseRef: "head"`를 자동 설치한다.
- `ExitWorktree` → 세션 cwd를 원래 repo 디렉터리(= 원래 브랜치)로 복귀.

분기 base는 EnterWorktree(`baseRef=head`)가 책임진다. **SHA 캡처/`reset --hard` 같은 수동 base 고정은 하지 않는다**(불필요).

병합 대상 기록만 별도로 필요하다: EnterWorktree가 세션을 worktree로 옮기면 "원래 어느 브랜치였는지"가 사라지므로, plan이 워크트리 생성 **직전에 `git branch --show-current` 결과(브랜치명 문자열)를 state에 기록**한다. 이것이 ship의 병합 대상(`origin_branch`)이다.

## 4. 스킬별 설계

### 4.1 plan

```
1. origin_branch = git branch --show-current   (메모)
   EnterWorktree(name=<stick_prefix>/<domain>-<rand6>)  → 세션이 worktree 진입
   state에 { "<stick>": "<origin_branch>" } 기록
   · 이미 stick worktree 안이면 누적(새 worktree 안 만듦)
2. [심층 분석 · 병렬]  Workflow fan-out (속도 목적)
     ├ architecture-mapper   (인접 서브시스템 구조)
     ├ convention-scout      (해당 도메인 규약)
     ├ test-pattern-analyzer (테스트 규약)
     └ reuse/adjacent scout  (유사기능·재사용 util·DB 스키마/엔티티)
3. 판별:  "기존 패턴에 추가" vs "신규(net-new) 기능"
     └ 신규 특수기능이면 → 구현 기술검토 + 제안 (필요 기술/라이브러리/접근)
4. [대화형 1문1답]  분석 근거로:
     - 코드 근거 제안 ("기존 X 연계 / 기존 Y 패턴 재사용", path:line)
     - 설계 접근 2-3안 + tradeoff + 권장
     - 확정 결정사항을 한 번에 하나씩 질문 → 답 수집
5. 산출물:
     - spec.md 자동 생성 (대화로 확정된 의도·결정·근거 기록)  ← 빈칸 채우기 폐기
     - plan.md 작성 (파일목록/레이어설계/테스트케이스/응답코드 + 사전구현필요 항목)
6. 보고 → /beaver:build
```

변경점:
- §2 dam 로직(dam 가드, 소스 묻기, dam 분기) **전부 삭제** → 워크트리 진입 + origin_branch 기록.
- 기존 단일 코드 스캔(§3)을 **Workflow 병렬 fan-out**으로 업글. 오케스트레이션은 analyze와 동일 방침(`Workflow→병렬 / Task→분산 / 순차`), 속도 위해 병렬 우선.
- "신규 vs 추가" 판별 + 신규면 기술검토/제안 단계 신설.
- **대화형 1문1답** 도입(설계 접근안 포함). spec은 대화 후 **자동 생성**(별도 brainstorming 스킬은 붙이지 않음 — plan이 beaver의 브레인스토밍).

> 별도 `superpowers:brainstorming` 스킬은 호출하지 않는다. 기존 plan이 코드근거 제안·결정사항·검토 게이트를 이미 갖춰 중복이므로, 그 안에 "접근안 2-3" + "대화형 1문1답"만 흡수한다.

### 4.2 build

```
1. [준비 · 병렬]  Workflow fan-out (속도 목적)
     - plan/revision 분석, 건드릴 기존 코드 매핑, 테스트케이스 설계, 재사용 파악
2. [구현 · 순차]  TDD red→green 단위별 + self-heal  (현행 유지)
```

변경점:
- **준비 단계만 병렬화**(분석 대기시간이 주 병목). 구현은 순차 유지 → TDD red→green 규율 보존.
- 나머지(전제검증, test_one, self-heal, 막힘 fallback, 리포트)는 현행 유지. 이미 worktree cwd 안이라 경로 변경 불필요.

### 4.3 ship (release 흡수 + resolve 인라인)

세션 cwd 관점 순서:

```
[cwd = stick worktree]
 1. 커밋             — 논리 단위 분리 제안 → 승인 후 커밋
 2. 코드리뷰         — memory 규칙 + CLAUDE.md 규약·plan/spec 의도 대비 자가리뷰
                      memory reconcile(미반영→CLAUDE.md), draft 규약 확정(마커 제거)
                      review.md 작성, 발견 항목 승인 게이트
 3. 전체 회귀        — commands.test 전체 실행 (release에서 흡수). green이어야 진행
 ── ExitWorktree → [cwd = 원래 repo dir, origin_branch] ──
 4. 전진 병합        — git merge origin/<origin_branch> 로 최신 끌어와 stick 전진 병합
                      충돌 시 인라인 resolve(ours/theirs 의도 → 규약대로 통합 → 마커정리 → 테스트 → 승인)
 5. push             — git push origin <origin_branch>
 6. 파기             — git worktree remove <stick> + git branch -d <stick> + state 정리
```

변경점:
- 기존 "dam 병합" → "**원래 브랜치 전진 병합 + push**"로 교체. dam ref 전진(`git branch -f dam stick`) 로직 삭제.
- release의 **전체 회귀 + 원격 push**를 ship이 흡수. release 스킬 삭제.
- resolve 절차를 **ship 안에 인라인**(별도 스킬 삭제).
- "일반 모드 / 자동 브랜치 모드" 2분기 제거 → stick-worktree 단일 모드.
- 병합은 stick **브랜치 ref**로 수행(워크트리 exit해도 ref는 남음). 머지 끝나고 6에서 worktree+브랜치 동시 제거.

스키마 안전성: stick worktree는 항상 최신 스키마이고 ship은 원래 브랜치로 **전진** 병합만 하므로(옛 스키마로 되돌리는 체크아웃 0회), 기존 모델이 dam 체조로 피하던 "옛 스키마 체크아웃 → ORM 자동싱크 → 컬럼 데이터 소실" 위험이 자연 소멸한다.

### 4.4 release / resolve — 삭제

- `release` 스킬·트리거 제거 (역할은 ship으로 흡수).
- `resolve` 스킬 제거 (충돌 로직은 ship 인라인).
  - **부수효과(수용)**: ship 밖의 일반 머지/리베이스/pull 충돌에 대한 전용 스킬이 사라진다.

### 4.5 analyze — config 스키마 갱신

- §4 config 블록에서 `branch.integration`(dam) 제거, `branch.stick_prefix` 유지.
- §4의 dam 설명 문단(integration/source/mainline 가드) 제거.
- 실측 오케스트레이션의 서브에이전트(architecture-mapper / convention-scout / test-pattern-analyzer)는 plan이 재사용하므로 유지.

## 5. 상태 / 설정 변경

| 대상 | 변경 |
|------|------|
| `.claude/settings.json` | `worktree.baseRef: "head"` 자동 설치 |
| `.beaver/config.json` `branch.integration` | 제거 |
| `.beaver/config.json` `branch.stick_prefix` | 유지 |
| `.beaver/.dam-state.json` | 폐기 |
| `.beaver/.auto-branch-state.json` | 의미 변경 → `{ "<stick>": "<origin_branch>" }` 매핑 |
| `.gitignore` | `.claude/worktrees/` 무시 필요 여부 확인 (CC 네이티브가 처리할 수 있음 — 구현 시 검증) |

## 6. 설계 결정 + 근거

| 결정 | 근거 |
|------|------|
| 워크트리 = CC `EnterWorktree` 위임 | 세션 cwd 자동 전환 + `.claude/worktrees/` 관리를 내장 제공. 자체 git worktree 관리 대비 재사용·일관성. |
| baseRef=head 자동 설치 | "현재 작업하던 브랜치에서 분기" 목적. 기본값 `fresh`는 origin/기본브랜치라 develop 등 누락. |
| dam 제거, 원래 브랜치 직접 병합 | 4계층 → 단순화. 병렬 세션엔 통합 버퍼 불필요. |
| ship이 회귀+push 흡수 | release 제거에 따라 검증·발행 책임을 ship으로 이관. |
| 매 ship마다 push (배칭 소멸) | 사용자 수용. 기능 1개 = stick = ship = 발행. 단순·병렬 친화. |
| build 준비만 병렬, 구현 순차 | 속도 병목은 분석 대기. 구현 병렬은 TDD·충돌 위험 → 안전 우선. |
| spec 대화 후 자동생성 | 기록(의도·결정) 영속 유지하되 입력은 대화로. 빈칸 채우기 제거. |

## 7. 알려진 한계 (문서에 명시)

- **공유 DB**: 병렬 worktree가 동일 dev DB를 쓰면 스키마 충돌 가능. worktree별 DB 분리는 사용자 책임.
- **단독 충돌**: resolve 삭제로 ship 밖 충돌(일반 머지/리베이스/pull)엔 전용 스킬 없음.
- **draft 규약 확정 지점**: release 제거로 ship이 유일한 확정 지점.
- **`.beaver/` 상태 파일의 worktree 격리**: 각 worktree에 `.beaver/`가 복제되므로 stick state는 자연 분리되나, origin_branch 매핑/공유 상태의 위치는 구현 시 확정 필요.

## 8. 구현 단계 분할 (제안)

scope가 크므로 plan(구현 계획)에서 단계로 쪼갠다:

1. **워크트리 기반 골격** — settings baseRef 설치, plan §2 dam로직 제거 + EnterWorktree/origin_branch 기록, ship ExitWorktree+전진병합+push+파기, config/state 정리.
2. **release/resolve 제거 + ship 인라인 흡수** — 회귀·push·충돌 처리 ship 통합, 두 스킬·트리거 삭제, analyze config 갱신.
3. **plan 심층분석 병렬화 + 대화형** — Workflow fan-out, 신규/추가 판별 + 기술검토, 1문1답, spec 자동생성.
4. **build 준비 병렬화** — 준비 fan-out, 구현 순차 유지.

각 단계는 독립 검증 가능(1 완료 시 병렬 워크트리 동작, 2 완료 시 dam 완전 제거, 3·4는 속도/품질 개선).
